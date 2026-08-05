import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Headers that prevent framing / override our rewrite — strip them.
const STRIP_HEADERS = new Set([
  "x-frame-options",
  "content-security-policy",
  "content-security-policy-report-only",
  "strict-transport-security",
  "x-content-type-options",
  "cross-origin-opener-policy",
  "cross-origin-embedder-policy",
  "cross-origin-resource-policy",
  "permissions-policy",
  "set-cookie",
  "set-cookie2",
])

function absolutize(url: string, base: string): string | null {
  try {
    return new URL(url, base).toString()
  } catch {
    return null
  }
}

// Rewrite a single attribute URL to route through the proxy.
function wrapUrl(rawUrl: string, baseUrl: string): string {
  const abs = absolutize(rawUrl, baseUrl)
  if (!abs) return rawUrl
  // Leave anchors + data: + blob: alone.
  if (abs.startsWith("#") || abs.startsWith("data:") || abs.startsWith("blob:") || abs.startsWith("javascript:")) {
    return abs
  }
  return `/api/proxy?url=${encodeURIComponent(abs)}`
}

// Rewrite HTML so links, assets, forms, and srcset point back through the proxy.
function rewriteHtml(html: string, baseUrl: string): string {
  // <base href> — capture the real base if present, then drop it.
  const baseMatch = html.match(/<base[^>]+href=["']([^"']+)["'][^>]*>/i)
  const effectiveBase = baseMatch ? absolutize(baseMatch[1], baseUrl) || baseUrl : baseUrl
  let out = html.replace(/<base[^>]*>/gi, "")

  // href= and src= (single + double quotes)
  out = out.replace(/(href|src|action|poster|formaction|data-src)\s*=\s*(["'])(.*?)\2/gi,
    (_m, attr, q, val) => `${attr}=${q}${wrapUrl(val, effectiveBase)}${q}`)

  // srcset="a 1x, b 2x"
  out = out.replace(/srcset\s*=\s*(["'])(.*?)\1/gi, (_m, q, val: string) => {
    const rewritten = val.split(",").map((part) => {
      const seg = part.trim()
      const [u, ...rest] = seg.split(/\s+/)
      return `${wrapUrl(u, effectiveBase)}${rest.length ? " " + rest.join(" ") : ""}`
    }).join(", ")
    return `srcset=${q}${rewritten}${q}`
  })

  // CSS url(...) in inline style attributes
  out = out.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (_m, q, val) => `url(${q}${wrapUrl(val, effectiveBase)}${q})`)

  // <meta http-equiv="refresh" content="0;url=...">
  out = out.replace(/(<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'])([^"']+)(["'])/gi,
    (_m, pre, val: string, post) => {
      const parts = val.split(/;/)
      const urlPart = parts.find((p) => p.trim().toLowerCase().startsWith("url="))
      if (urlPart) {
        const idx = parts.indexOf(urlPart)
        const raw = urlPart.split("=").slice(1).join("=").trim()
        parts[idx] = `url=${wrapUrl(raw, effectiveBase)}`
      }
      return `${pre}${parts.join(";")}${post}`
    })

  // Inject a base target + a small script that intercepts link clicks + form submits
  // to keep navigation inside the proxy, and patches window.open.
  const injector = `
<base target="_self">
<script>
(function(){
  function wrap(u){ try{ if(!u) return u; if(u.startsWith('#')||u.startsWith('data:')||u.startsWith('blob:')||u.startsWith('javascript:')) return u; return '/api/proxy?url='+encodeURIComponent(new URL(u, location.href).href); }catch(e){ return u; } }
  document.addEventListener('click', function(e){
    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if(!a) return;
    var href = a.getAttribute('href');
    if(!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    e.preventDefault();
    var abs = new URL(href, location.href).href;
    parent.postMessage({ type: 'stratus-navigate', url: abs }, '*');
    location.href = wrap(abs);
  }, true);
  document.addEventListener('submit', function(e){
    if(!e.target || e.target.tagName !== 'FORM') return;
    var f = e.target;
    if(f.getAttribute('method') && f.getAttribute('method').toLowerCase() === 'get'){
      // let it serialize; rewrite action so GET form stays in proxy
      var action = f.getAttribute('action');
      if(action){ f.setAttribute('action', wrap(action)); }
    }
  }, true);
  // Block top-level redirects from breaking out of the iframe
  try { Object.defineProperty(window, 'top', { get: function(){ return window; } }); } catch(e){}
  try { window.open = function(u){ if(u){ location.href = wrap(u); } return null; }; } catch(e){}
})();
<\/script>`

  // Inject before </head> (or prepend if no head)
  if (/<\/head>/i.test(out)) {
    out = out.replace(/<\/head>/i, injector + "</head>")
  } else {
    out = injector + out
  }
  return out
}

function rewriteCss(css: string, baseUrl: string): string {
  return css.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (_m, q, val) => `url(${q}${wrapUrl(val, baseUrl)}${q})`)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const target = searchParams.get("url")
  if (!target) {
    return new NextResponse("Missing url", { status: 400 })
  }
  let targetUrl: URL
  try {
    targetUrl = new URL(target)
  } catch {
    return new NextResponse("Invalid url", { status: 400 })
  }
  // Block loopback to our own proxy to avoid recursion.
  if (targetUrl.hostname === "localhost" || targetUrl.hostname === "127.0.0.1" || target === "") {
    return new NextResponse("Blocked", { status: 400 })
  }

  try {
    const upstream = await fetch(targetUrl.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      // @ts-ignore — cache option is valid in undici fetch
      cache: "no-store",
    })

    const contentType = (upstream.headers.get("content-type") || "").toLowerCase()
    const headers = new Headers()
    // Copy only safe headers
    for (const [k, v] of upstream.headers.entries()) {
      if (!STRIP_HEADERS.has(k.toLowerCase())) {
        headers.set(k, v)
      }
    }
    // Allow framing
    headers.set("X-Frame-Options", "ALLOWALL")
    headers.delete("Content-Security-Policy")

    const finalUrl = upstream.url || targetUrl.toString()

    if (contentType.includes("text/html")) {
      const html = await upstream.text()
      const rewritten = rewriteHtml(html, finalUrl)
      headers.set("Content-Type", "text/html; charset=utf-8")
      return new NextResponse(rewritten, { status: 200, headers })
    }
    if (contentType.includes("text/css")) {
      const css = await upstream.text()
      const rewritten = rewriteCss(css, finalUrl)
      headers.set("Content-Type", "text/css; charset=utf-8")
      return new NextResponse(rewritten, { status: 200, headers })
    }
    // Pass through everything else (images, js, fonts, json) as a stream.
    const buf = Buffer.from(await upstream.arrayBuffer())
    return new NextResponse(buf, { status: 200, headers })
  } catch (e) {
    return new NextResponse(
      `Proxy error: ${e instanceof Error ? e.message : "unknown"}`,
      { status: 502, headers: { "Content-Type": "text/plain" } }
    )
  }
}

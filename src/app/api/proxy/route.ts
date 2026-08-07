import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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
  try { return new URL(url, base).toString() } catch { return null }
}

function wrapUrl(rawUrl: string, baseUrl: string): string {
  const abs = absolutize(rawUrl, baseUrl)
  if (!abs) return rawUrl
  if (abs.startsWith("#") || abs.startsWith("data:") || abs.startsWith("blob:") || abs.startsWith("javascript:")) return abs
  return `/api/proxy?url=${encodeURIComponent(abs)}`
}

function rewriteHtml(html: string, baseUrl: string): string {
  const baseMatch = html.match(/<base[^>]+href=["']([^"']+)["'][^>]*>/i)
  const effectiveBase = baseMatch ? absolutize(baseMatch[1], baseUrl) || baseUrl : baseUrl
  let out = html.replace(/<base[^>]*>/gi, "")

  out = out.replace(/(href|src|action|poster|formaction|data-src)\s*=\s*(["'])(.*?)\2/gi,
    (_m, attr, q, val) => `${attr}=${q}${wrapUrl(val, effectiveBase)}${q}`)

  out = out.replace(/srcset\s*=\s*(["'])(.*?)\1/gi, (_m, q, val: string) => {
    const rewritten = val.split(",").map((part) => {
      const seg = part.trim()
      const [u, ...rest] = seg.split(/\s+/)
      return `${wrapUrl(u, effectiveBase)}${rest.length ? " " + rest.join(" ") : ""}`
    }).join(", ")
    return `srcset=${q}${rewritten}${q}`
  })

  out = out.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (_m, q, val) => `url(${q}${wrapUrl(val, effectiveBase)}${q})`)

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

  // Inject script — uses the ORIGINAL url from the query param as base for resolving relative links
  const injector = `
<base target="_self">
<script>
(function(){
  var origUrl = new URLSearchParams(location.search).get('url') || location.href;
  function wrap(u){
    try{
      if(!u) return u;
      if(u.startsWith('#')||u.startsWith('data:')||u.startsWith('blob:')||u.startsWith('javascript:')) return u;
      var abs = new URL(u, origUrl).href;
      return '/api/proxy?url='+encodeURIComponent(abs);
    }catch(e){ return u; }
  }
  document.addEventListener('click', function(e){
    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if(!a) return;
    var href = a.getAttribute('href');
    if(!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    e.preventDefault();
    var abs = new URL(href, origUrl).href;
    parent.postMessage({ type: 'stratus-navigate', url: abs }, '*');
    location.href = wrap(abs);
  }, true);
  document.addEventListener('submit', function(e){
    if(!e.target || e.target.tagName !== 'FORM') return;
    var f = e.target;
    var action = f.getAttribute('action');
    if(action){ f.setAttribute('action', wrap(action)); }
  }, true);
  try { Object.defineProperty(window, 'top', { get: function(){ return window; } }); } catch(e){}
  try { window.open = function(u){ if(u){ location.href = wrap(u); } return null; }; } catch(e){}
})();
<\/script>`

  if (/<\/head>/i.test(out)) {
    out = out.replace(/<\/head>/i, injector + "</head>")
  } else {
    out = injector + out
  }
  return out
}

function rewriteCss(css: string, baseUrl: string): string {
  // Rewrite url() and @import references
  let out = css.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (_m, q, val) => `url(${q}${wrapUrl(val, baseUrl)}${q})`)
  out = out.replace(/@import\s+(['"])(.*?)\1/gi, (_m, q, val) => `@import ${q}${wrapUrl(val, baseUrl)}${q}`)
  out = out.replace(/@import\s+url\(\s*(['"]?)(.*?)\1\s*\)/gi, (_m, q, val) => `@import url(${q}${wrapUrl(val, baseUrl)}${q})`)
  return out
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const target = searchParams.get("url")
  if (!target) return new NextResponse("Missing url", { status: 400 })

  let targetUrl: URL
  try { targetUrl = new URL(target) } catch { return new NextResponse("Invalid url", { status: 400 }) }

  if (targetUrl.hostname === "localhost" || targetUrl.hostname === "127.0.0.1") {
    return new NextResponse("Blocked", { status: 400 })
  }

  try {
    const upstream = await fetch(targetUrl.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      // @ts-ignore
      cache: "no-store",
    })

    const contentType = (upstream.headers.get("content-type") || "").toLowerCase()
    const headers = new Headers()
    for (const [k, v] of upstream.headers.entries()) {
      if (!STRIP_HEADERS.has(k.toLowerCase())) headers.set(k, v)
    }
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
    // Explicitly set JS content-type so browser doesn't display it as text
    if (contentType.includes("javascript") || contentType.includes("ecmascript") || contentType.includes("text/js")) {
      headers.set("Content-Type", "application/javascript; charset=utf-8")
    }
    // Pass through everything else (images, js, fonts, json)
    const buf = Buffer.from(await upstream.arrayBuffer())
    return new NextResponse(buf, { status: 200, headers })
  } catch (e) {
    return new NextResponse(
      `Proxy error: ${e instanceof Error ? e.message : "unknown"}`,
      { status: 502, headers: { "Content-Type": "text/plain" } }
    )
  }
}

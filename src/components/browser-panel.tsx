"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, ArrowRight, RotateCw, Globe, ExternalLink, Lock, Home } from "lucide-react"
import { QUICK_LINKS } from "@/lib/client-constants"

export function BrowserPanel() {
  const [input, setInput] = useState("")
  const [url, setUrl] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [index, setIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const normalizeUrl = (raw: string): string => {
    const v = raw.trim()
    if (!v) return ""
    if (/^https?:\/\//i.test(v)) return v
    if (/^[\w-]+(\.[\w-]+)+/.test(v)) return "https://" + v
    return "https://www.google.com/search?q=" + encodeURIComponent(v)
  }

  const navigate = (raw: string) => {
    const u = normalizeUrl(raw)
    if (!u) return
    const next = history.slice(0, index + 1)
    next.push(u)
    setHistory(next)
    setIndex(next.length - 1)
    setUrl(u)
    setInput(u)
    setLoading(true)
  }

  const back = () => {
    if (index > 0) {
      const i = index - 1
      setIndex(i)
      setUrl(history[i])
      setInput(history[i])
      setLoading(true)
    }
  }
  const forward = () => {
    if (index < history.length - 1) {
      const i = index + 1
      setIndex(i)
      setUrl(history[i])
      setInput(history[i])
      setLoading(true)
    }
  }
  const reload = () => {
    if (url && iframeRef.current) {
      setLoading(true)
      // Re-set src to force reload
      const src = iframeRef.current.src
      iframeRef.current.src = "about:blank"
      setTimeout(() => {
        if (iframeRef.current) iframeRef.current.src = src
      }, 30)
    }
  }

  return (
    <div className="h-[calc(100vh-3.5rem-2rem)] flex flex-col bg-background">
      {/* Toolbar */}
      <div className="h-12 shrink-0 px-2 flex items-center gap-1.5 border-b border-border">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={back} disabled={index <= 0} aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={forward} disabled={index >= history.length - 1} aria-label="Forward">
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={reload} disabled={!url} aria-label="Reload">
          <RotateCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        </Button>
        <form
          className="flex-1 flex items-center"
          onSubmit={(e) => {
            e.preventDefault()
            navigate(input)
          }}
        >
          <div className="relative w-full">
            <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-500" />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search or enter address"
              className="h-8 pl-8 pr-8 text-sm"
              autoFocus
            />
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Open in new tab"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </form>
      </div>

      {/* Quick links */}
      <div className="h-9 shrink-0 px-3 flex items-center gap-1.5 border-b border-border overflow-x-auto">
        <span className="text-[11px] text-muted-foreground shrink-0 flex items-center gap-1">
          <Home className="h-3 w-3" /> Quick:
        </span>
        {QUICK_LINKS.map((q) => (
          <button
            key={q.url}
            onClick={() => navigate(q.url)}
            className="text-xs px-2 py-0.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground whitespace-nowrap"
          >
            {q.name}
          </button>
        ))}
      </div>

      {/* Viewport */}
      <div className="flex-1 bg-white relative">
        {!url ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-background">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
              <Globe className="h-7 w-7 text-emerald-500" />
            </div>
            <h2 className="text-lg font-semibold">Stratus Browser</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Enter a URL above. Sites that allow embedding will render here; others can be opened in a new tab via the icon in the address bar.
            </p>
          </div>
        ) : (
          <>
            <iframe
              ref={iframeRef}
              src={url}
              title="Browser"
              className="w-full h-full border-none bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
              referrerPolicy="no-referrer"
              onLoad={() => setLoading(false)}
            />
            {loading && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs bg-background/90 backdrop-blur px-3 py-1 rounded-full border border-border text-muted-foreground shadow">
                Loading… if the page is blank, the site blocks embedding — use ⧉ to open in a new tab.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

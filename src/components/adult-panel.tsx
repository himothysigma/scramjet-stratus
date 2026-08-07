"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Lock, ExternalLink, Eye, EyeOff, ArrowLeft, Maximize2, Loader2 } from "lucide-react"
import { toast } from "sonner"

const ADULT_PASSWORD = "Samseunlore+2711"
const ADULT_KEY = "synnical-adult-verified"

// Adult content sources — openly labeled, password-gated
const ADULT_LINKS = [
  { name: "xxBrits", url: "https://www.xxbrits.com/", category: "British Videos" },
  { name: "HornyFap", url: "https://hornyfap.tv/categories/porn/", category: "Categories" },
  { name: "Pornhub", url: "https://www.pornhub.com/", category: "Videos" },
  { name: "xHamster", url: "https://xhamster.com/", category: "Videos" },
  { name: "xVideos", url: "https://www.xvideos.com/", category: "Videos" },
  { name: "RedTube", url: "https://www.redtube.com/", category: "Videos" },
  { name: "SpankBang", url: "https://spankbang.com/", category: "Videos" },
  { name: "Eporner", url: "https://www.eporner.com/", category: "Videos" },
]

export function AdultPanel() {
  const [verified, setVerified] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [activeUrl, setActiveUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(ADULT_KEY) === ADULT_PASSWORD) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setVerified(true)
    }
  }, [])

  const verify = () => {
    if (password === ADULT_PASSWORD) {
      localStorage.setItem(ADULT_KEY, ADULT_PASSWORD)
      setVerified(true)
      toast.success("Access granted")
    } else {
      toast.error("Incorrect password")
    }
  }

  // If viewing a specific site, show it in an iframe (inside Synnical, not new tab)
  if (verified && activeUrl) {
    return (
      <div className="h-full flex flex-col bg-[#0a0a0a]">
        <div className="h-11 shrink-0 px-3 flex items-center justify-between border-b border-[#2a2a2a]">
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setActiveUrl(null)}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <span className="text-sm font-medium truncate">{activeUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
            const el = document.querySelector('iframe')
            if (el) { document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen?.() }
          }} aria-label="Fullscreen">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 relative bg-[#0a0a0a]">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-red-500" />
              <p className="text-sm text-[#888888]">Loading… if blank, the site blocks embedding.</p>
            </div>
          )}
          <iframe
            src={activeUrl}
            title="Adult content"
            className="w-full h-full"
            style={{ border: "none" }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
            referrerPolicy="no-referrer"
            onLoad={() => setLoading(false)}
          />
        </div>
      </div>
    )
  }

  if (!verified) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold text-[#f0f0f0]">18+ Adult Section</h1>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 text-left space-y-2">
            <p className="font-semibold text-[#f0f0f0] text-sm">Legal Disclaimer</p>
            <ul className="text-xs text-[#888888] space-y-1 ml-4 list-disc">
              <li>You must be 18 years of age or older (21 in some jurisdictions)</li>
              <li>Viewing adult content must be legal in your jurisdiction</li>
              <li>You consent to viewing explicit adult material</li>
              <li>You will not permit minors to access this content</li>
              <li>Synnical is not responsible for third-party content</li>
            </ul>
          </div>
          <div className="space-y-2 text-left">
            <Label htmlFor="adult-pass" className="text-sm text-[#f0f0f0]">Enter password to verify</Label>
            <div className="relative">
              <Input
                id="adult-pass"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verify()}
                placeholder="Password"
                className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f0f0f0] pr-10"
                autoFocus
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#f0f0f0]"
                type="button"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button onClick={verify} disabled={!password} className="w-full bg-red-500 hover:bg-red-600 text-white">
            <Lock className="h-4 w-4 mr-2" />
            Verify & Enter
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto custom-scroll">
      <div className="max-w-3xl mx-auto p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[#f0f0f0]">18+ Adult</h1>
            <p className="text-sm text-[#888888]">Password-verified — opens inside Synnical</p>
          </div>
        </div>

        <div className="mt-4 mb-5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] p-3">
          <p className="text-xs text-[#888888]">
            <AlertTriangle className="h-3 w-3 inline mr-1 text-red-500" />
            Verified. Click a site to open it inside Synnical. Some sites may block embedding — if blank, use the external link button.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ADULT_LINKS.map((link) => (
            <div key={link.name} className="flex items-center gap-3 p-4 rounded-xl border border-[#2a2a2a] bg-[#121212] hover:border-red-500/40 hover:bg-[#1a1a1a] transition-all">
              <button
                onClick={() => { setActiveUrl(link.url); setLoading(true) }}
                className="flex items-center gap-3 flex-1 text-left"
              >
                <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                  <ExternalLink className="h-4 w-4 text-red-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-[#f0f0f0] truncate">{link.name}</p>
                  <p className="text-[10px] text-[#888888]">{link.category}</p>
                </div>
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              localStorage.removeItem(ADULT_KEY)
              setVerified(false)
              setPassword("")
              toast.info("Access cleared")
            }}
            className="text-[#888888] border-[#2a2a2a]"
          >
            Clear verification
          </Button>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Lock, ExternalLink, Eye, EyeOff } from "lucide-react"
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

  // Check if already verified on mount
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
      toast.success("Access granted — welcome to the 18+ section")
    } else {
      toast.error("Incorrect password")
    }
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
            <p className="text-sm text-[#888888]">Password-verified adult content</p>
          </div>
        </div>

        <div className="mt-4 mb-5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] p-3">
          <p className="text-xs text-[#888888]">
            <AlertTriangle className="h-3 w-3 inline mr-1 text-red-500" />
            Verified. Content is provided by third-party sites — Synnical is not affiliated.
            To remove access, clear your browser data.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ADULT_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-3 p-4 rounded-xl border border-[#2a2a2a] bg-[#121212] hover:border-red-500/40 hover:bg-[#1a1a1a] transition-all"
            >
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                <ExternalLink className="h-4 w-4 text-red-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-[#f0f0f0] truncate">{link.name}</p>
                <p className="text-[10px] text-[#888888]">{link.category}</p>
              </div>
            </a>
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

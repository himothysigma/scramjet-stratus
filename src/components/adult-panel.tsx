"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ExternalLink, Lock } from "lucide-react"
import { AgeGate, isAgeConfirmed } from "@/components/age-gate"
import { toast } from "sonner"

// Adult content sources — openly labeled, age-gated
// These are well-known adult content aggregators. The user takes responsibility
// for the content. Synnical provides the age gate + proxy, not the content itself.
const ADULT_LINKS = [
  { name: "Pornhub", url: "https://www.pornhub.com/", category: "Videos" },
  { name: "xHamster", url: "https://xhamster.com/", category: "Videos" },
  { name: "xVideos", url: "https://www.xvideos.com/", category: "Videos" },
  { name: "RedTube", url: "https://www.redtube.com/", category: "Videos" },
  { name: "SpankBang", url: "https://spankbang.com/", category: "Videos" },
  { name: "Eporner", url: "https://www.eporner.com/", category: "Videos" },
]

export function AdultPanel() {
  const [confirmed, setConfirmed] = useState(false)
  const [showGate, setShowGate] = useState(false)

  // Check if already confirmed on mount
  useState(() => {
    if (isAgeConfirmed()) setConfirmed(true)
  })

  if (!confirmed) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold text-[#f0f0f0]">18+ Adult Section</h1>
          <p className="text-sm text-[#888888]">
            This section contains adult content intended for users 18 years and older.
            You must confirm your age and agree to the legal disclaimer before entering.
          </p>
          <Button
            onClick={() => setShowGate(true)}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <Lock className="h-4 w-4 mr-2" />
            Enter 18+ Section
          </Button>
        </div>
        {showGate && (
          <AgeGate
            onConfirm={() => { setConfirmed(true); setShowGate(false); toast.success("Age confirmed — welcome to the 18+ section") }}
            onCancel={() => setShowGate(false)}
          />
        )}
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
            <p className="text-sm text-[#888888]">Age-verified adult content</p>
          </div>
        </div>

        <div className="mt-4 mb-5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] p-3">
          <p className="text-xs text-[#888888]">
            <AlertTriangle className="h-3 w-3 inline mr-1 text-red-500" />
            You have confirmed you are 18+. Content is provided by third-party sites.
            Use the proxy toggle in the browser if sites don't load directly.
            To remove your age confirmation, clear your browser data.
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
              localStorage.removeItem("synnical-age-confirmed-18")
              setConfirmed(false)
              toast.info("Age confirmation cleared")
            }}
            className="text-[#888888]"
          >
            Clear age confirmation
          </Button>
        </div>
      </div>
    </div>
  )
}

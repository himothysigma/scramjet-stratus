"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { AlertTriangle, ShieldCheck } from "lucide-react"

const AGE_GATE_KEY = "synnical-age-confirmed-18"

export function AgeGate({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const [confirmed, setConfirmed] = useState(false)
  const [disclaimer, setDisclaimer] = useState(false)

  const canEnter = confirmed && disclaimer

  const handleEnter = () => {
    if (!canEnter) return
    localStorage.setItem(AGE_GATE_KEY, Date.now().toString())
    onConfirm()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            18+ Adult Content
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 space-y-2">
            <p className="font-semibold text-[#f0f0f0]">Legal Disclaimer</p>
            <p className="text-[#888888] text-xs leading-relaxed">
              By entering this section, you confirm and agree that:
            </p>
            <ul className="text-xs text-[#888888] space-y-1.5 ml-4 list-disc">
              <li>You are at least 18 years of age (21 in some jurisdictions)</li>
              <li>Viewing adult content is legal in your country/jurisdiction</li>
              <li>You consent to viewing explicit adult material</li>
              <li>You will not permit minors to access this content</li>
              <li>Synnical is not responsible for the content of external sites</li>
              <li>All content is provided by third-party websites not affiliated with Synnical</li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Checkbox id="age-confirm" checked={confirmed} onCheckedChange={(v) => setConfirmed(!!v)} className="mt-0.5" />
              <Label htmlFor="age-confirm" className="text-xs cursor-pointer leading-relaxed">
                I confirm that I am 18 years of age or older
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox id="disclaimer-confirm" checked={disclaimer} onCheckedChange={(v) => setDisclaimer(!!v)} className="mt-0.5" />
              <Label htmlFor="disclaimer-confirm" className="text-xs cursor-pointer leading-relaxed">
                I have read and agree to the legal disclaimer above
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button
            disabled={!canEnter}
            onClick={handleEnter}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            Enter 18+ Section
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function isAgeConfirmed(): boolean {
  if (typeof window === "undefined") return false
  return !!localStorage.getItem(AGE_GATE_KEY)
}

export function clearAgeConfirmation() {
  if (typeof window !== "undefined") localStorage.removeItem(AGE_GATE_KEY)
}

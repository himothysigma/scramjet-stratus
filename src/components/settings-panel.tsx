"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Crown, Loader2, LogOut, Shield, ShieldCheck, KeyRound } from "lucide-react"
import { toast } from "sonner"

export function SettingsPanel() {
  const { user, setUser, logout } = useAuth()
  const [password, setPassword] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  if (!user) return null

  const verify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    setVerifying(true)
    try {
      const { user: updated } = await api.verifyOwner(password)
      setUser(updated)
      setPassword("")
      toast.success("Ownership verified — you are now an Owner")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed")
    } finally {
      setVerifying(false)
    }
  }

  const onLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="h-[calc(100vh-3.5rem-2rem)] overflow-y-auto">
      <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Account & ownership.</p>
        </div>

        {/* Account summary */}
        <section className="rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold mb-3">Account</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{user.displayName}</p>
              <p className="text-xs text-muted-foreground">@{user.username}</p>
            </div>
            {user.isOwner ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Owner
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-1">
                <Shield className="h-3.5 w-3.5" /> Member
              </span>
            )}
          </div>
        </section>

        {/* Owner verification */}
        <section className="rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-semibold">Verify ownership</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Enter the owner password to unlock the Owner role. Owners display a crown badge across chat and profile.
          </p>

          {user.isOwner ? (
            <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400">
              <Crown className="h-4 w-4" />
              You are verified as Owner.
            </div>
          ) : (
            <form onSubmit={verify} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="ownerPass">Owner password</Label>
                <Input
                  id="ownerPass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter owner password"
                  autoComplete="off"
                />
              </div>
              <Button type="submit" disabled={!password || verifying} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Verify ownership
              </Button>
            </form>
          )}
        </section>

        {/* Danger zone */}
        <section className="rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold mb-3">Session</h2>
          <Button variant="outline" onClick={onLogout} disabled={loggingOut} className="gap-2 text-destructive hover:text-destructive">
            {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Log out
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            You stay logged in across visits until you log out manually.
          </p>
        </section>
      </div>
    </div>
  )
}

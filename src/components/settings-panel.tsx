"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"
import { api, type SafeUser, type Role } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Crown, Loader2, LogOut, Shield, ShieldCheck, KeyRound, Users, VolumeX, Volume2 } from "lucide-react"
import { toast } from "sonner"
import { ROLES } from "@/lib/constants"
import { DisplayName, RoleBadge, AvatarWithDeco } from "@/components/role-ui"

export function SettingsPanel() {
  const { user, setUser, logout } = useAuth()
  const [password, setPassword] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [users, setUsers] = useState<SafeUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const loadUsers = useCallback(async () => {
    if (!user || user.role !== "OWNER") return
    setLoadingUsers(true)
    try {
      const { users } = await api.listUsers()
      setUsers(users)
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
    finally { setLoadingUsers(false) }
  }, [user])

  useEffect(() => { loadUsers() }, [loadUsers])

  if (!user) return null

  const verify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    setVerifying(true)
    try {
      const { user: updated } = await api.verifyOwner(password)
      setUser(updated); setPassword("")
      toast.success("Ownership verified — you are now the Owner")
    } catch (err) { toast.error(err instanceof Error ? err.message : "Verification failed") }
    finally { setVerifying(false) }
  }

  const onLogout = async () => {
    setLoggingOut(true)
    try { await logout() } finally { setLoggingOut(false) }
  }

  const assignRole = async (u: SafeUser, role: Role) => {
    try { await api.assignRole(u.id, role); toast.success(`${u.displayName} is now ${role}`); loadUsers() }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
  }

  const toggleMute = async (u: SafeUser) => {
    try {
      if (u.muted) { await api.unmuteUser(u.id); toast.success(`${u.displayName} unmuted`) }
      else { await api.muteUser(u.id); toast.success(`${u.displayName} muted`) }
      loadUsers()
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
  }

  return (
    <div className="h-[calc(100vh-3.5rem-2rem)] overflow-y-auto custom-scroll">
      <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Account, ownership & moderation.</p>
        </div>

        {/* Account */}
        <section className="rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold mb-3">Account</h2>
          <div className="flex items-center justify-between">
            <div>
              <DisplayName name={user.displayName} role={user.role} className="text-sm font-medium" />
              <p className="text-xs text-muted-foreground">@{user.username}</p>
            </div>
            {user.role !== "MEMBER" ? <RoleBadge role={user.role} /> : <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-1"><Shield className="h-3.5 w-3.5" />Member</span>}
          </div>
        </section>

        {/* Owner verification */}
        <section className="rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-semibold">Verify ownership</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Enter the owner password to unlock the Owner role. Owners get golden glowing names, all permissions, GIF uploads, avatar decorations, and profile effects.</p>
          {user.role === "OWNER" ? (
            <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400">
              <Crown className="h-4 w-4" /> You are verified as Owner.
            </div>
          ) : (
            <form onSubmit={verify} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="ownerPass">Owner password</Label>
                <Input id="ownerPass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter owner password" autoComplete="off" />
              </div>
              <Button type="submit" disabled={!password || verifying} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}Verify ownership
              </Button>
            </form>
          )}
        </section>

        {/* Owner: user management */}
        {user.role === "OWNER" && (
          <section className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-semibold">User Management</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Assign roles (admin/mod) and mute users. Owner has all permissions.</p>
            {loadingUsers ? <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> : (
              <div className="space-y-1 max-h-80 overflow-y-auto custom-scroll">
                {users.filter((u) => u.id !== user.id).map((u) => (
                  <div key={u.id} className="flex items-center gap-2 py-2 border-b border-border last:border-0">
                    <AvatarWithDeco src={u.pfpUrl} name={u.displayName} role={u.role} avatarDeco={u.avatarDeco} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5"><DisplayName name={u.displayName} role={u.role} className="text-sm" /><RoleBadge role={u.role} /></div>
                      <p className="text-xs text-muted-foreground">@{u.username}{u.muted && " · muted"}</p>
                    </div>
                    <Select value={u.role} onValueChange={(v) => assignRole(u, v as Role)}>
                      <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLES.filter((r) => r !== "OWNER").map((r) => <SelectItem key={r} value={r} className="text-xs">{r.charAt(0) + r.slice(1).toLowerCase()}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toggleMute(u)} aria-label={u.muted ? "Unmute" : "Mute"}>
                      {u.muted ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5 text-destructive" />}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Session */}
        <section className="rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold mb-3">Session</h2>
          <Button variant="outline" onClick={onLogout} disabled={loggingOut} className="gap-2 text-destructive hover:text-destructive">
            {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}Log out
          </Button>
          <p className="text-xs text-muted-foreground mt-2">You stay logged in across visits until you log out manually.</p>
        </section>
      </div>
    </div>
  )
}

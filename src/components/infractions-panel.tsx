"use client"

import { useState, useEffect, useCallback } from "react"
import { api, type SafeUser } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AvatarWithDeco, DisplayName, RoleBadge } from "@/components/role-ui"
import {
  Shield, ShieldAlert, AlertTriangle, Ban, Trash2, Loader2, Search, Gavel, Clock, Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AUTO_PUNISHMENTS } from "@/lib/constants"

type InfractionType = "WARN" | "MUTE" | "BAN" | "AUTO_MUTE" | "AUTO_BAN"

type Infraction = {
  id: string
  userId: string
  issuerId: string
  type: InfractionType
  reason: string
  duration: number | null
  createdAt: string
  user?: SafeUser
  issuer?: SafeUser
}

const TYPE_TABS: { id: string; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "WARN", label: "Warnings" },
  { id: "MUTE", label: "Mutes" },
  { id: "BAN", label: "Bans" },
  { id: "AUTO_MUTE", label: "Auto-Mutes" },
  { id: "AUTO_BAN", label: "Auto-Bans" },
]

const TYPE_CONFIG: Record<InfractionType, { label: string; cls: string; Icon: typeof AlertTriangle }> = {
  WARN: { label: "Warn", cls: "bg-amber-500/15 text-amber-500 border-amber-500/30", Icon: AlertTriangle },
  MUTE: { label: "Mute", cls: "bg-orange-500/15 text-orange-500 border-orange-500/30", Icon: ShieldAlert },
  BAN: { label: "Ban", cls: "bg-red-500/15 text-red-500 border-red-500/30", Icon: Ban },
  AUTO_MUTE: { label: "Auto-Mute", cls: "bg-pink-500/15 text-pink-500 border-pink-500/30", Icon: ShieldAlert },
  AUTO_BAN: { label: "Auto-Ban", cls: "bg-pink-500/20 text-pink-600 border-pink-500/40", Icon: Ban },
}

function formatDuration(min: number | null): string {
  if (min === null) return "permanent"
  if (min < 60) return `${min}m`
  if (min < 1440) return `${Math.floor(min / 60)}h`
  return `${Math.floor(min / 1440)}d`
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}d ago`
  return new Date(iso).toLocaleDateString()
}

export function InfractionsPanel() {
  const { user } = useAuth()
  const [tab, setTab] = useState<string>("ALL")
  const [infractions, setInfractions] = useState<Infraction[]>([])
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<SafeUser[]>([])
  const [search, setSearch] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const canDelete = user?.role === "OWNER" || user?.role === "ADMIN"

  const loadInfractions = useCallback(async (type: string) => {
    setLoading(true)
    try {
      const { infractions: data } = await api.listInfractions(type === "ALL" ? undefined : type)
      setInfractions(data as Infraction[])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load infractions")
    } finally {
      setLoading(false)
    }
  }, [])

  const loadUsers = useCallback(async () => {
    try {
      const { users: u } = await api.listUsers()
      setUsers(u)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load users")
    }
  }, [])

  useEffect(() => {
    loadInfractions(tab)
  }, [tab, loadInfractions])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  if (!user) return null

  // Filter the user list by the search box (username or displayName, case-insensitive)
  const filteredUsers = search.trim()
    ? users.filter(
        (u) =>
          u.username.toLowerCase().includes(search.trim().toLowerCase()) ||
          u.displayName.toLowerCase().includes(search.trim().toLowerCase())
      )
    : users

  const submitWarn = async () => {
    if (!selectedUserId || !reason.trim()) {
      toast.error("Pick a user and enter a reason")
      return
    }
    setSubmitting(true)
    try {
      await api.warnUser(selectedUserId, reason.trim())
      toast.success("Warning issued")
      setReason("")
      setSelectedUserId("")
      setSearch("")
      // Reload both lists so the new warn shows up immediately
      await Promise.all([loadInfractions(tab), loadUsers()])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to issue warning")
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await api.deleteInfraction(id)
      toast.success("Infraction removed")
      setInfractions((prev) => prev.filter((i) => i.id !== id))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete infraction")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 px-4 h-11 flex items-center gap-2 border-b border-border">
        <Shield className="h-4 w-4 text-pink-500" />
        <span className="font-semibold">Moderation</span>
        <Badge variant="outline" className="ml-1 border-pink-500/40 text-pink-500">
          <Shield className="h-2.5 w-2.5" />
          {user.role === "OWNER" ? "Owner" : user.role === "ADMIN" ? "Admin" : "Mod"}
        </Badge>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground hidden sm:block">
          {infractions.length} record{infractions.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5">
          {/* Auto-punishment thresholds */}
          <section className="rounded-xl border border-pink-500/20 bg-pink-500/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-pink-500" />
              <h2 className="text-sm font-semibold text-pink-600">Auto-Punishment Thresholds</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Warnings accumulate on a user&apos;s account. When thresholds are crossed, automatic
              punishments are applied.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ThresholdCard
                count={AUTO_PUNISHMENTS.WARN_THRESHOLD_1H_MUTE}
                label="1 hour mute"
                Icon={Clock}
              />
              <ThresholdCard
                count={AUTO_PUNISHMENTS.WARN_THRESHOLD_24H_MUTE}
                label="24 hour mute"
                Icon={ShieldAlert}
              />
              <ThresholdCard
                count={AUTO_PUNISHMENTS.WARN_THRESHOLD_PERM_BAN}
                label="Permanent ban"
                Icon={Ban}
              />
            </div>
          </section>

          {/* Warn user */}
          <section className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Gavel className="h-4 w-4 text-pink-500" />
              <h2 className="text-sm font-semibold">Warn a user</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="warn-search" className="text-xs">Search user</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="warn-search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="username or display name"
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Pick user</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {filteredUsers.length === 0 ? (
                      <SelectItem value="__none" disabled>No matches</SelectItem>
                    ) : (
                      filteredUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id} disabled={u.id === user.id}>
                          <span className="flex items-center gap-2">
                            <span>{u.displayName}</span>
                            <span className="text-muted-foreground text-xs">@{u.username}</span>
                            {u.warnCount > 0 && (
                              <span className="ml-1 text-[10px] bg-amber-500/15 text-amber-500 px-1 rounded">
                                {u.warnCount}w
                              </span>
                            )}
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="warn-reason" className="text-xs">Reason</Label>
              <Input
                id="warn-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this user being warned?"
                maxLength={200}
                onKeyDown={(e) => { if (e.key === "Enter" && !submitting) submitWarn() }}
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={submitWarn}
                disabled={!selectedUserId || !reason.trim() || submitting}
                className="bg-pink-500 hover:bg-pink-600 text-white"
              >
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
                Issue warning
              </Button>
            </div>
          </section>

          {/* Infractions table */}
          <section className="rounded-xl border border-border overflow-hidden">
            <Tabs value={tab} onValueChange={setTab}>
              <div className="p-2 border-b border-border overflow-x-auto">
                <TabsList className="bg-muted/50">
                  {TYPE_TABS.map((t) => (
                    <TabsTrigger key={t.id} value={t.id} className="text-xs">
                      {t.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>

            <div className="max-h-[420px] overflow-y-auto custom-scroll">
              {loading ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : infractions.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  No infractions in this view.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/60 backdrop-blur text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left font-medium px-3 py-2">User</th>
                      <th className="text-left font-medium px-3 py-2 hidden sm:table-cell">Type</th>
                      <th className="text-left font-medium px-3 py-2">Reason</th>
                      <th className="text-left font-medium px-3 py-2 hidden md:table-cell">Issuer</th>
                      <th className="text-left font-medium px-3 py-2 hidden lg:table-cell">When</th>
                      {canDelete && <th className="px-3 py-2 w-10" />}
                    </tr>
                  </thead>
                  <tbody>
                    {infractions.map((inf) => {
                      const cfg = TYPE_CONFIG[inf.type] || TYPE_CONFIG.WARN
                      const { Icon } = cfg
                      return (
                        <tr key={inf.id} className="border-t border-border hover:bg-accent/40 align-top">
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <AvatarWithDeco
                                src={inf.user?.pfpUrl}
                                name={inf.user?.displayName || "?"}
                                role={(inf.user?.role || "MEMBER") as SafeUser["role"]}
                                avatarDeco={inf.user?.avatarDeco}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <DisplayName
                                    name={inf.user?.displayName || "Unknown"}
                                    role={(inf.user?.role || "MEMBER") as SafeUser["role"]}
                                    className="text-sm truncate"
                                  />
                                  {inf.user && inf.user.role !== "MEMBER" && (
                                    <RoleBadge role={inf.user.role} />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  @{inf.user?.username || "unknown"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 hidden sm:table-cell">
                            <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border", cfg.cls)}>
                              <Icon className="h-2.5 w-2.5" />
                              {cfg.label}
                            </span>
                            {inf.duration !== null && (
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {formatDuration(inf.duration)}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="text-sm text-foreground/90 break-words line-clamp-2">{inf.reason}</p>
                            <span className={cn("sm:hidden inline-flex items-center gap-1 text-[10px] font-semibold uppercase mt-1 px-1.5 py-0.5 rounded border", cfg.cls)}>
                              <Icon className="h-2.5 w-2.5" />{cfg.label}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 hidden md:table-cell">
                            <div className="flex items-center gap-2 min-w-0">
                              <AvatarWithDeco
                                src={inf.issuer?.pfpUrl}
                                name={inf.issuer?.displayName || "?"}
                                role={(inf.issuer?.role || "MEMBER") as SafeUser["role"]}
                                avatarDeco={inf.issuer?.avatarDeco}
                                size="xs"
                              />
                              <div className="min-w-0">
                                <DisplayName
                                  name={inf.issuer?.displayName || "System"}
                                  role={(inf.issuer?.role || "MEMBER") as SafeUser["role"]}
                                  className="text-xs truncate"
                                />
                                <p className="text-[10px] text-muted-foreground truncate">
                                  @{inf.issuer?.username || "system"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 hidden lg:table-cell text-xs text-muted-foreground whitespace-nowrap">
                            {formatRelative(inf.createdAt)}
                          </td>
                          {canDelete && (
                            <td className="px-3 py-2.5 text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => onDelete(inf.id)}
                                disabled={deletingId === inf.id}
                                aria-label="Delete infraction"
                              >
                                {deletingId === inf.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function ThresholdCard({
  count,
  label,
  Icon,
}: {
  count: number
  label: string
  Icon: typeof AlertTriangle
}) {
  return (
    <div className="rounded-lg border border-pink-500/20 bg-background/60 p-3 flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-pink-500/15 text-pink-500 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">At</p>
        <p className="text-sm font-semibold leading-tight">
          {count} <span className="text-muted-foreground font-normal">warns</span>
        </p>
        <p className="text-xs text-pink-600">{label}</p>
      </div>
    </div>
  )
}

"use client"

import { useRef, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ImageCropperV2 } from "@/components/image-cropper-v2"
import { AccountStats } from "@/components/account-stats"
import { Camera, Loader2, Check, Crown, Sparkles, Palette, Zap, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { AVATAR_DECOS, PROFILE_EFFECTS } from "@/lib/constants"
import { DisplayName, RoleBadge, AvatarWithDeco, ProfileEffectLayer } from "@/components/role-ui"

export function ProfilePanel() {
  const { user, setUser } = useAuth()
  const [displayName, setDisplayName] = useState(user?.displayName || "")
  const [bio, setBio] = useState(user?.bio || "")
  const [status, setStatus] = useState(user?.status || "")
  const [username, setUsername] = useState(user?.username || "")
  const [saving, setSaving] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)
  const [savingDeco, setSavingDeco] = useState(false)
  const [uploading, setUploading] = useState<"pfp" | "banner" | null>(null)
  const [statsOpen, setStatsOpen] = useState(false)

  const [cropOpen, setCropOpen] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropMode, setCropMode] = useState<"pfp" | "banner">("pfp")
  const pfpInput = useRef<HTMLInputElement>(null)
  const bannerInput = useRef<HTMLInputElement>(null)

  if (!user) return null

  const isOwner = user.role === "OWNER"
  const dirty = displayName !== user.displayName || bio !== user.bio || username !== user.username

  const saveProfile = async () => {
    setSaving(true)
    try {
      const { user: updated } = await api.updateProfile({ displayName, bio, username })
      setUser(updated); toast.success("Profile saved")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
    finally { setSaving(false) }
  }

  const saveStatus = async () => {
    setSavingStatus(true)
    try {
      const { user: updated } = await api.setStatus(status)
      setUser(updated); toast.success("Status updated")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
    finally { setSavingStatus(false) }
  }

  const onPickPfp = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || !file.type.startsWith("image/")) { toast.error("Please choose an image"); return }
    // GIF: owner can crop+zoom too (cropper outputs PNG, so animation is lost — ask first)
    if (file.type === "image/gif") {
      if (!isOwner) { toast.error("GIF profile pictures are owner-only"); return }
      // Route through cropper so owner can zoom/rotate. Output is PNG (static).
      // To keep animation, they can skip crop — handled by a direct upload button below.
      setCropSrc(URL.createObjectURL(file)); setCropMode("pfp"); setCropOpen(true); return
    }
    setCropSrc(URL.createObjectURL(file)); setCropMode("pfp"); setCropOpen(true)
  }

  const onPickBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || !file.type.startsWith("image/")) { toast.error("Please choose an image"); return }
    if (file.type === "image/gif") {
      if (!isOwner) { toast.error("GIF banners are owner-only"); return }
      // Route through cropper so owner can zoom/rotate. Output is PNG (static).
      setCropSrc(URL.createObjectURL(file)); setCropMode("banner"); setCropOpen(true); return
    }
    setCropSrc(URL.createObjectURL(file)); setCropMode("banner"); setCropOpen(true)
  }

  const uploadDirect = async (type: "pfp" | "banner", file: Blob) => {
    setUploading(type)
    try {
      const { user: updated } = await api.uploadImage(type, file)
      setUser(updated); toast.success(`${type === "pfp" ? "Profile picture" : "Banner"} updated`)
    } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed") }
    finally { setUploading(null) }
  }

  const onCropConfirm = async (blob: Blob) => {
    setCropOpen(false)
    await uploadDirect(cropMode, blob)
    if (cropSrc) URL.revokeObjectURL(cropSrc); setCropSrc(null)
  }

  const onCropCancel = () => {
    setCropOpen(false)
    if (cropSrc) URL.revokeObjectURL(cropSrc); setCropSrc(null)
  }

  const setDeco = async (field: "avatarDeco" | "profileEffect", value: string) => {
    setSavingDeco(true)
    try {
      const body = field === "avatarDeco" ? { avatarDeco: value } : { profileEffect: value }
      const { user: updated } = await api.setDeco(body.avatarDeco, body.profileEffect)
      setUser(updated)
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
    finally { setSavingDeco(false) }
  }

  return (
    <div className="h-full overflow-y-auto custom-scroll profile-effect-container">
      {isOwner && <ProfileEffectLayer effect={user.profileEffect} />}
      <div className="max-w-2xl mx-auto p-4 sm:p-6 relative z-10">
        {/* Banner */}
        <div className="relative rounded-xl overflow-hidden border border-border bg-muted/40 group">
          <div className="h-40 sm:h-48 w-full bg-gradient-to-br from-pink-500/20 via-background to-background">
            {user.bannerUrl && <img src={user.bannerUrl} alt="Banner" className={user.bannerIsGif ? "w-full h-full object-cover" : "w-full h-full object-cover"} />}
          </div>
          <button onClick={() => bannerInput.current?.click()} disabled={uploading === "banner"} className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-background/90 backdrop-blur border border-border hover:bg-background disabled:opacity-50">
            {uploading === "banner" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            {user.bannerUrl ? "Change banner" : "Upload banner"}
          </button>
          <input ref={bannerInput} type="file" accept="image/*" className="hidden" onChange={onPickBanner} />
        </div>

        {/* PFP + identity */}
        <div className="flex items-end gap-4 -mt-8 px-2 relative z-10">
          <div className="relative">
            <AvatarWithDeco src={user.pfpUrl} name={user.displayName} role={user.role} avatarDeco={user.avatarDeco} isGif={user.pfpIsGif} size="xl" className="border-4 border-background" />
            <button onClick={() => pfpInput.current?.click()} disabled={uploading === "pfp"} className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-background border border-border flex items-center justify-center hover:bg-accent disabled:opacity-50" aria-label="Change profile picture">
              {uploading === "pfp" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            </button>
            <input ref={pfpInput} type="file" accept="image/*" className="hidden" onChange={onPickPfp} />
          </div>
          <div className="pb-1">
            <div className="flex items-center gap-2">
              <DisplayName name={user.displayName} role={user.role} className="text-lg font-semibold" />
              <RoleBadge role={user.role} />
            </div>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            {user.status && <p className="text-xs text-muted-foreground mt-0.5 italic">"{user.status}"</p>}
          </div>
        </div>

        {/* Editable fields */}
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={32} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username {isOwner && <span className="text-amber-500 text-xs">(owner: 1 char min)</span>}</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))} maxLength={24} />
            <p className="text-xs text-muted-foreground">Lowercase letters, numbers, hyphens, underscores. {isOwner ? "Owner can use 1 char." : "Min 2 chars."}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} rows={3} placeholder="Tell people about yourself" />
            <p className="text-xs text-muted-foreground text-right">{bio.length}/200</p>
          </div>
          <Button
            variant="outline"
            className="w-full gap-2 border-pink-500/30 text-pink-600 hover:bg-pink-500/5 hover:text-pink-600"
            onClick={() => setStatsOpen(true)}
          >
            <ShieldCheck className="h-4 w-4" />
            Account Standing &amp; Stats
          </Button>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <div className="flex gap-2">
              <Input id="status" value={status} onChange={(e) => setStatus(e.target.value)} maxLength={100} placeholder="What are you up to?" />
              <Button onClick={saveStatus} disabled={savingStatus || status === user.status} variant="outline" className="shrink-0">{savingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}</Button>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveProfile} disabled={!dirty || saving} className="bg-pink-500 hover:bg-pink-600 text-white">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : dirty ? <Check className="mr-2 h-4 w-4" /> : null}
              Save changes
            </Button>
          </div>
        </div>

        {/* Owner-only: avatar deco + profile effects */}
        {isOwner ? (
          <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-amber-600">Owner Decorations</h3>
            </div>
            <p className="text-xs text-muted-foreground">Avatar decorations and profile effects are owner-exclusive. Normal members see images only — no GIFs, no deco, no effects.</p>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Palette className="h-3.5 w-3.5" /> Avatar Decoration</Label>
              <Select value={user.avatarDeco || "none"} onValueChange={(v) => setDeco("avatarDeco", v)} disabled={savingDeco}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AVATAR_DECOS.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> Profile Effect</Label>
              <Select value={user.profileEffect || "none"} onValueChange={(v) => setDeco("profileEffect", v)} disabled={savingDeco}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROFILE_EFFECTS.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Effects animate your profile when others view it.</p>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground">
              GIF profile pictures/banners, avatar decorations, and profile effects are owner-exclusive features. Verify ownership in Settings to unlock them.
            </p>
          </div>
        )}
      </div>

      <ImageCropperV2 open={cropOpen} src={cropSrc} aspect={cropMode === "pfp" ? 1 : 3} circular={cropMode === "pfp"} title={cropMode === "pfp" ? "Crop profile picture" : "Crop banner"} onConfirm={onCropConfirm} onCancel={onCropCancel} />

      <AccountStats open={statsOpen} onOpenChange={setStatsOpen} />
    </div>
  )
}

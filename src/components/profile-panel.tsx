"use client"

import { useRef, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { api } from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ImageCropper } from "@/components/image-cropper"
import { Crown, Camera, Loader2, Check } from "lucide-react"
import { toast } from "sonner"

export function ProfilePanel() {
  const { user, setUser } = useAuth()
  const [displayName, setDisplayName] = useState(user?.displayName || "")
  const [bio, setBio] = useState(user?.bio || "")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<"pfp" | "banner" | null>(null)

  // cropper state
  const [cropOpen, setCropOpen] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropMode, setCropMode] = useState<"pfp" | "banner">("pfp")
  const [isGifBanner, setIsGifBanner] = useState(false)
  const pfpInput = useRef<HTMLInputElement>(null)
  const bannerInput = useRef<HTMLInputElement>(null)

  if (!user) return null

  const dirty = displayName !== user.displayName || bio !== user.bio

  const saveProfile = async () => {
    setSaving(true)
    try {
      const { user: updated } = await api.updateProfile({ displayName, bio })
      setUser(updated)
      toast.success("Profile saved")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally {
      setSaving(false)
    }
  }

  const onPickPfp = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image")
      return
    }
    const url = URL.createObjectURL(file)
    setCropSrc(url)
    setCropMode("pfp")
    setIsGifBanner(false)
    setCropOpen(true)
  }

  const onPickBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image")
      return
    }
    // GIFs are uploaded as-is to preserve animation (no crop).
    if (file.type === "image/gif") {
      uploadDirect("banner", file)
      return
    }
    const url = URL.createObjectURL(file)
    setCropSrc(url)
    setCropMode("banner")
    setIsGifBanner(false)
    setCropOpen(true)
  }

  const uploadDirect = async (type: "pfp" | "banner", file: Blob) => {
    setUploading(type)
    try {
      const { user: updated } = await api.uploadImage(type, file)
      setUser(updated)
      toast.success(`${type === "pfp" ? "Profile picture" : "Banner"} updated`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(null)
    }
  }

  const onCropConfirm = async (blob: Blob) => {
    setCropOpen(false)
    await uploadDirect(cropMode, blob)
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  const onCropCancel = () => {
    setCropOpen(false)
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  return (
    <div className="h-[calc(100vh-3.5rem-2rem)] overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        {/* Banner */}
        <div className="relative rounded-xl overflow-hidden border border-border bg-muted/40 group">
          <div className="h-40 sm:h-48 w-full bg-gradient-to-br from-emerald-500/20 via-background to-background">
            {user.bannerUrl && (
              <img src={user.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
            )}
          </div>
          <button
            onClick={() => bannerInput.current?.click()}
            disabled={uploading === "banner"}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-background/90 backdrop-blur border border-border hover:bg-background disabled:opacity-50"
          >
            {uploading === "banner" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            {user.bannerUrl ? "Change banner" : "Upload banner"}
          </button>
          <input ref={bannerInput} type="file" accept="image/*" className="hidden" onChange={onPickBanner} />
        </div>

        {/* PFP + identity */}
        <div className="flex items-end gap-4 -mt-8 px-2">
          <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-background">
              <AvatarImage src={user.pfpUrl || undefined} alt={user.displayName} />
              <AvatarFallback className="bg-emerald-500/15 text-emerald-600 text-xl">
                {user.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => pfpInput.current?.click()}
              disabled={uploading === "pfp"}
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-background border border-border flex items-center justify-center hover:bg-accent disabled:opacity-50"
              aria-label="Change profile picture"
            >
              {uploading === "pfp" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            </button>
            <input ref={pfpInput} type="file" accept="image/*" className="hidden" onChange={onPickPfp} />
          </div>
          <div className="pb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">{user.displayName}</h1>
              {user.isOwner && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
                  <Crown className="h-3 w-3" /> Owner
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          </div>
        </div>

        {/* Editable fields */}
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={32}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="Tell people about yourself"
            />
            <p className="text-xs text-muted-foreground text-right">{bio.length}/200</p>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={saveProfile}
              disabled={!dirty || saving}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : dirty ? <Check className="mr-2 h-4 w-4" /> : null}
              Save changes
            </Button>
          </div>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Tip: GIF banners keep their animation. Profile pictures are cropped to a circle.
        </p>
      </div>

      <ImageCropper
        open={cropOpen}
        src={cropSrc}
        aspect={cropMode === "pfp" ? 1 : 3}
        circular={cropMode === "pfp"}
        title={cropMode === "pfp" ? "Crop profile picture" : "Crop banner"}
        onConfirm={onCropConfirm}
        onCancel={onCropCancel}
      />
    </div>
  )
}

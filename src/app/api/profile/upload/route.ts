import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { UPLOAD_DIR } from "@/lib/constants"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { randomBytes } from "crypto"

// POST /api/profile/upload — accepts a cropped image file (pfp or banner)
// Form fields: type ("pfp" | "banner"), file (Blob)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const form = await req.formData()
  const type = form.get("type")
  const file = form.get("file")

  if (type !== "pfp" && type !== "banner") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  }
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No file" }, { status: 400 })
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (8MB max)" }, { status: 400 })
  }

  // Determine extension from mime type (supports gif banners).
  const mime = file.type
  let ext = "png"
  if (mime === "image/jpeg") ext = "jpg"
  else if (mime === "image/png") ext = "png"
  else if (mime === "image/gif") ext = "gif"
  else if (mime === "image/webp") ext = "webp"
  else {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 })
  }

  if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true })

  const name = `${user.id}-${type}-${randomBytes(4).toString("hex")}.${ext}`
  const fullPath = path.join(UPLOAD_DIR, name)
  const buf = Buffer.from(await file.arrayBuffer())
  await writeFile(fullPath, buf)

  const url = `/api/uploads/${name}`
  const data: { pfpUrl?: string; bannerUrl?: string } =
    type === "pfp" ? { pfpUrl: url } : { bannerUrl: url }
  const updated = await db.user.update({ where: { id: user.id }, data })

  return NextResponse.json({
    url,
    user: {
      id: updated.id,
      username: updated.username,
      displayName: updated.displayName,
      bio: updated.bio,
      pfpUrl: updated.pfpUrl,
      bannerUrl: updated.bannerUrl,
      isOwner: updated.isOwner,
    },
  })
}

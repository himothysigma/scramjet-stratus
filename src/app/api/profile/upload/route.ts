import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser, toSafeUser, canUseGifAndDeco } from "@/lib/auth"
import { UPLOAD_DIR } from "@/lib/constants"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { randomBytes } from "crypto"

export const runtime = "nodejs"

// POST /api/profile/upload — accepts a cropped image file (pfp or banner)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const form = await req.formData()
    const type = form.get("type")
    const file = form.get("file")

    if (type !== "pfp" && type !== "banner") {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (8MB max)" }, { status: 400 })
    }

    const mime = file.type
    let ext = "png"
    let isGif = false
    if (mime === "image/jpeg") ext = "jpg"
    else if (mime === "image/png") ext = "png"
    else if (mime === "image/gif") { ext = "gif"; isGif = true }
    else if (mime === "image/webp") ext = "webp"
    else {
      return NextResponse.json({ error: "Unsupported image type" }, { status: 400 })
    }

    // GIF is owner-only
    if (isGif && !canUseGifAndDeco(user.role)) {
      return NextResponse.json(
        { error: "GIF uploads are owner-only. Use a static image (PNG/JPG/WebP)." },
        { status: 403 }
      )
    }

    // Create upload directory if it doesn't exist
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    const name = `${user.id}-${type}-${randomBytes(4).toString("hex")}.${ext}`
    const fullPath = path.join(UPLOAD_DIR, name)
    const buf = Buffer.from(await file.arrayBuffer())
    await writeFile(fullPath, buf)

    const url = `/api/uploads/${name}`
    const data: { pfpUrl?: string; bannerUrl?: string; pfpIsGif?: boolean; bannerIsGif?: boolean } =
      type === "pfp"
        ? { pfpUrl: url, pfpIsGif: isGif }
        : { bannerUrl: url, bannerIsGif: isGif }
    const updated = await db.user.update({ where: { id: user.id }, data })

    return NextResponse.json({
      url,
      user: toSafeUser(updated),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[upload] Error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

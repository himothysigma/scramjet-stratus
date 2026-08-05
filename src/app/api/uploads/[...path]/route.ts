import { NextRequest, NextResponse } from "next/server"
import { UPLOAD_DIR } from "@/lib/constants"
import { readFile } from "fs/promises"
import path from "path"

// GET /api/uploads/<file> — serves uploaded images from the persistent uploads dir.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params
  if (!segments || segments.length === 0) {
    return new NextResponse("Not found", { status: 404 })
  }

  // Reject anything that tries to escape the uploads dir.
  const joined = segments.join("/")
  if (joined.includes("..")) {
    return new NextResponse("Not found", { status: 404 })
  }

  const fullPath = path.join(UPLOAD_DIR, path.basename(joined))
  try {
    const buf = await readFile(fullPath)
    const ext = path.extname(fullPath).toLowerCase()
    const mime =
      ext === ".gif" ? "image/gif" :
      ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
      ext === ".webp" ? "image/webp" :
      "image/png"

    return new NextResponse(buf, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch {
    return new NextResponse("Not found", { status: 404 })
  }
}

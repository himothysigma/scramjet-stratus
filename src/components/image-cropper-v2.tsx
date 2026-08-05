"use client"

import { useState, useEffect } from "react"
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import {
  Loader2,
  Crop as CropIcon,
  RotateCcw,
  ZoomIn,
  RotateCw,
} from "lucide-react"

function defaultCrop(aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: aspect >= 1 ? 90 : 50 }, aspect),
    aspect
  )
}

export function ImageCropperV2({
  open,
  src,
  aspect,
  circular,
  title,
  onConfirm,
  onCancel,
}: {
  open: boolean
  src: string | null
  aspect: number
  circular?: boolean
  title: string
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}) {
  const [crop, setCrop] = useState<Crop>(() => defaultCrop(aspect))
  const [completed, setCompleted] = useState<PixelCrop | null>(null)
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotate, setRotate] = useState(0)

  useEffect(() => {
    if (open) {
      setCrop(defaultCrop(aspect))
      setCompleted(null)
      setImgEl(null)
      setZoom(1)
      setRotate(0)
    }
  }, [open, aspect])

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImgEl(e.currentTarget)
  }

  const reset = () => {
    setZoom(1)
    setRotate(0)
  }

  /**
   * Produce the cropped PNG blob.
   *
   * Visual model:
   *  - The <img> is laid out at display size (dw x dh) and its layout box is
   *    what ReactCrop measures the crop rectangle in (PixelCrop = display px).
   *  - CSS `transform: scale(zoom) rotate(theta)` is applied around the image's
   *    center (ccx, ccy) = (dw/2, dh/2). The crop overlay is NOT transformed,
   *    so the user sees a fixed crop rectangle with the image rotating/zooming
   *    behind it.
   *
   * Canvas math:
   *  For an output pixel (ox_n, oy_n) in natural-resolution canvas, the
   *  corresponding layout-space visual point is
   *    v = (cx + ox_n/sx, cy + oy_n/sy)
   *  and the source natural pixel is found by inverting T = scale(zoom)∘rotate
   *  around the image center:
   *    p_natural = c_natural + (1/zoom) * R(-theta) * (v - c_layout) * (sx, sy)
   *
   * Equivalent forward transform (applied via ctx.translate/rotate/scale so we
   * can use a single drawImage call), outermost → innermost:
   *    scale(sx, sy)                  // layout-canvas → natural-resolution canvas
   *    translate(ccx - cx, ccy - cy)  // move crop top-left to origin
   *    scale(zoom, zoom)              // user zoom (around image center)
   *    rotate(theta)                  // user rotate (around image center)
   *    scale(1/sx, 1/sy)              // natural coords → layout coords
   *    translate(-ccx*sx, -ccy*sy)    // image center → origin (in natural coords)
   *    drawImage(img, 0, 0)           // draw at natural size
   *
   * Verified: zoom=1/rotate=0 reduces to a plain crop; zoom=2 magnifies 2x
   * around the image center; rotate=90° maps the right edge of the image to the
   * bottom of the crop — exactly matching the CSS visual.
   */
  const produceBlob = async (): Promise<Blob | null> => {
    if (!imgEl || !completed) return null
    const img = imgEl
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    const dw = img.width
    const dh = img.height
    if (!nw || !nh || !dw || !dh) return null

    const sx = nw / dw // display → natural scale
    const sy = nh / dh

    const cx = completed.x // crop rect in display px
    const cy = completed.y
    const cw = completed.width
    const ch = completed.height

    // Output canvas at natural resolution for the crop region.
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(cw * sx))
    canvas.height = Math.max(1, Math.round(ch * sy))
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"

    // Optional circular clip (for pfp). For aspect=1 the canvas is square so
    // the inscribed circle fills it.
    if (circular) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(
        canvas.width / 2,
        canvas.height / 2,
        Math.min(canvas.width, canvas.height) / 2,
        0,
        2 * Math.PI
      )
      ctx.closePath()
      ctx.clip()
    }

    const ccx = dw / 2 // image center in layout space
    const ccy = dh / 2
    const theta = (rotate * Math.PI) / 180

    ctx.save()
    ctx.scale(sx, sy)
    ctx.translate(ccx - cx, ccy - cy)
    ctx.scale(zoom, zoom)
    ctx.rotate(theta)
    ctx.scale(1 / sx, 1 / sy)
    ctx.translate(-ccx * sx, -ccy * sy)
    ctx.drawImage(img, 0, 0)
    ctx.restore()

    if (circular) ctx.restore()

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/png", 0.92)
    })
  }

  const confirm = async () => {
    setBusy(true)
    try {
      const blob = await produceBlob()
      if (blob) onConfirm(blob)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent
        className="max-w-xl border-zinc-800/60"
        style={{ backgroundColor: "#0a0a0f" }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <CropIcon className="h-4 w-4 text-emerald-500" />
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* Crop area — overflow:hidden clips the transformed image so it
            doesn't bleed out of the dialog while still letting ReactCrop's
            crop overlay render within the image's layout box. */}
        <div
          className="rounded-md flex items-center justify-center p-2"
          style={{ backgroundColor: "#0a0a0f" }}
        >
          {src ? (
            <div
              style={{
                overflow: "hidden",
                maxHeight: "50vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompleted(c)}
                aspect={aspect}
                circularCrop={circular}
                keepSelection
              >
                <img
                  src={src}
                  alt="To crop"
                  onLoad={onImageLoad}
                  style={{
                    maxHeight: "50vh",
                    transform: `scale(${zoom}) rotate(${rotate}deg)`,
                    transformOrigin: "center center",
                  }}
                />
              </ReactCrop>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-zinc-500 text-sm">
              No image
            </div>
          )}
        </div>

        {/* Zoom + Rotate controls */}
        <div
          className="space-y-4 rounded-md border border-zinc-800/60 p-4"
          style={{ backgroundColor: "#0a0a0f" }}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-zinc-300 flex items-center gap-2">
                <ZoomIn className="h-3.5 w-3.5 text-emerald-500" />
                Zoom
              </Label>
              <span className="text-xs text-zinc-400 tabular-nums">
                {zoom.toFixed(2)}x
              </span>
            </div>
            <Slider
              value={[zoom]}
              min={0.5}
              max={3}
              step={0.01}
              onValueChange={(v) => setZoom(v[0])}
              aria-label="Zoom"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-zinc-300 flex items-center gap-2">
                <RotateCw className="h-3.5 w-3.5 text-emerald-500" />
                Rotate
              </Label>
              <span className="text-xs text-zinc-400 tabular-nums">
                {rotate}°
              </span>
            </div>
            <Slider
              value={[rotate]}
              min={-180}
              max={180}
              step={1}
              onValueChange={(v) => setRotate(v[0])}
              aria-label="Rotate"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={reset}
            disabled={busy}
            className="border-zinc-700/60 text-zinc-300 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={busy}
            className="text-zinc-300 hover:text-zinc-100"
          >
            Cancel
          </Button>
          <Button
            onClick={confirm}
            disabled={busy || !completed}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crop & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ImageCropperV2

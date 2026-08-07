"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function VoiceRecorder({ onSent, disabled }: { onSent: (voiceUrl: string) => void; disabled?: boolean }) {
  const [recording, setRecording] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [duration, setDuration] = useState(0)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" })
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        if (blob.size < 1000) { toast.error("Recording too short"); return }

        setUploading(true)
        try {
          const { url } = await api.uploadVoice(blob)
          onSent(url)
          toast.success("Voice message sent")
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Upload failed")
        } finally {
          setUploading(false)
        }
      }
      recorder.start()
      mediaRef.current = recorder
      setRecording(true)
      setDuration(0)
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
    } catch (e) {
      toast.error("Microphone access denied")
    }
  }, [onSent])

  const stopRecording = useCallback(() => {
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      mediaRef.current.stop()
    }
    setRecording(false)
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  if (uploading) {
    return <Button size="icon" variant="ghost" className="h-9 w-9" disabled><Loader2 className="h-4 w-4 animate-spin" /></Button>
  }

  if (recording) {
    return (
      <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 rounded-lg px-2 py-1">
        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs text-red-400 tabular-nums">{Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, "0")}</span>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-300" onClick={stopRecording} aria-label="Stop recording">
          <Square className="h-3.5 w-3.5 fill-current" />
        </Button>
      </div>
    )
  }

  return (
    <Button size="icon" variant="ghost" className="h-9 w-9 text-[#888888] hover:text-pink-500" onClick={startRecording} disabled={disabled} aria-label="Record voice message" title="Record voice message">
      <Mic className="h-4 w-4" />
    </Button>
  )
}

// Voice message playback component
export function VoiceMessage({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const toggle = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url)
      audioRef.current.onended = () => setPlaying(false)
    }
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      audioRef.current.play()
      setPlaying(true)
    }
  }

  return (
    <button onClick={toggle} className="flex items-center gap-2 bg-pink-500/10 border border-pink-500/30 rounded-lg px-3 py-1.5 hover:bg-pink-500/20 transition-colors">
      {playing ? <Square className="h-3.5 w-3.5 text-pink-500 fill-current" /> : <Mic className="h-3.5 w-3.5 text-pink-500" />}
      <span className="text-xs text-pink-400">{playing ? "Stop" : "Play voice message"}</span>
    </button>
  )
}

"use client"

import { useAuth } from "@/hooks/use-auth"
import { AuthScreen } from "@/components/auth-screen"
import { AppShell } from "@/components/app-shell"
import { Loader2 } from "lucide-react"

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#0a0a0a]">
        <Loader2 className="h-7 w-7 animate-spin text-pink-500" />
        <p className="text-sm text-[#888888]">Loading Synnical…</p>
      </div>
    )
  }

  return user ? <AppShell /> : <AuthScreen />
}

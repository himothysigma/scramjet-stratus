"use client"

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react"
import { api, type SafeUser } from "@/lib/api"

type AuthState = {
  user: SafeUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  setUser: (u: SafeUser) => void
}

const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<SafeUser | null>(null)
  const [loading, setLoading] = useState(true)

  // On mount, restore session from the httpOnly cookie. This makes login persist
  // across visits / devices (cookie lasts 1 year).
  const refresh = useCallback(async () => {
    try {
      const { user } = await api.me()
      setUserState(user)
    } catch {
      setUserState(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = useCallback(async (username: string, password: string) => {
    const { user } = await api.login(username, password)
    setUserState(user)
  }, [])

  const register = useCallback(async (username: string, password: string) => {
    const { user } = await api.register(username, password)
    setUserState(user)
  }, [])

  const logout = useCallback(async () => {
    await api.logout()
    setUserState(null)
  }, [])

  const setUser = useCallback((u: SafeUser) => setUserState(u), [])

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, refresh, setUser }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}

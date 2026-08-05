"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { REGIONS, QUALITY_LEVELS } from "@/lib/client-constants"

type GamingState = {
  regionId: string
  qualityId: string
  setRegion: (id: string) => void
  setQuality: (id: string) => void
  region: () => (typeof REGIONS)[number]
  quality: () => (typeof QUALITY_LEVELS)[number]
}

export const useGaming = create<GamingState>()(
  persist(
    (set, get) => ({
      regionId: "auto",
      qualityId: "medium",
      setRegion: (id) => set({ regionId: id }),
      setQuality: (id) => set({ qualityId: id }),
      region: () => REGIONS.find((r) => r.id === get().regionId) || REGIONS[0],
      quality: () => QUALITY_LEVELS.find((q) => q.id === get().qualityId) || QUALITY_LEVELS[1],
    }),
    { name: "stratus-gaming" }
  )
)

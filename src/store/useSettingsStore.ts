'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  showHandOverlay: boolean
  toggleHandOverlay: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      showHandOverlay: true,
      toggleHandOverlay: () => set({ showHandOverlay: !get().showHandOverlay }),
    }),
    { name: 'typing-lab-settings' }
  )
)

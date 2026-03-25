'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {}

export const useSettingsStore = create<SettingsState>()(
  persist(() => ({}), { name: 'typing-lab-settings' })
)

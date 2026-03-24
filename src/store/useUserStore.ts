'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface UserState {
  user: User | null
  isLoggedIn: boolean

  login: (user: User) => void
  logout: () => void
  addExp: (amount: number) => void
  levelUp: () => void
  checkAndUpdateStreak: () => void
}

const EXP_PER_LEVEL = 1000

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,

      login: (user) => set({ user, isLoggedIn: true }),

      logout: () => set({ user: null, isLoggedIn: false }),

      addExp: (amount) => {
        const { user } = get()
        if (!user) return

        const newExp = user.exp + amount
        const newLevel = Math.floor(newExp / EXP_PER_LEVEL) + 1

        set({
          user: {
            ...user,
            exp: newExp,
            level: newLevel,
          },
        })
      },

      levelUp: () => {
        const { user } = get()
        if (!user) return
        set({ user: { ...user, level: user.level + 1 } })
      },

      checkAndUpdateStreak: () => {
        const { user } = get()
        if (!user) return

        const today = new Date().toISOString().split('T')[0]
        const lastLogin = user.lastLogin.split('T')[0]

        const todayDate = new Date(today)
        const lastDate = new Date(lastLogin)
        const diffDays = Math.floor(
          (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        let newStreak = user.streakDays
        if (diffDays === 1) {
          newStreak = user.streakDays + 1
        } else if (diffDays > 1) {
          newStreak = 0
        }
        // diffDays === 0 이면 같은 날 → streak 변경 없음

        set({
          user: {
            ...user,
            lastLogin: new Date().toISOString(),
            streakDays: newStreak,
          },
        })
      },
    }),
    {
      name: 'typing-lab-user',
    }
  )
)

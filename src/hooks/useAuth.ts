'use client'

/**
 * Auth 추상화 레이어
 *
 * Phase 1: LocalStorage 기반 세션 (nickname + 4자리 PIN)
 * Phase 2: 이 훅의 내부만 Supabase Auth로 교체 — 호출부 변경 없음
 */

import { useUserStore } from '@/store/useUserStore'
import { useProgressStore } from '@/store/useProgressStore'
import { checkDailyBonus } from '@/lib/scoring'
import type { User } from '@/types'

const USERS_STORAGE_KEY = 'typing-lab-users'

function loadUsers(): Record<string, User> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveUsers(users: Record<string, User>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
}

function generateUid(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function useAuth() {
  const { user, isLoggedIn, login, logout: storeLogout, addExp, checkAndUpdateStreak } =
    useUserStore()
  const { initUnlock } = useProgressStore()

  const register = async (nickname: string, pin: string): Promise<{ success: boolean; message: string }> => {
    if (nickname.trim().length < 2) {
      return { success: false, message: '닉네임은 2글자 이상이어야 해요' }
    }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return { success: false, message: '비밀번호는 숫자 4자리여야 해요' }
    }

    const users = loadUsers()
    const existing = Object.values(users).find((u) => u.nickname === nickname.trim())
    if (existing) {
      return { success: false, message: '이미 사용 중인 닉네임이에요' }
    }

    const newUser: User = {
      uid: generateUid(),
      nickname: nickname.trim(),
      pin,
      level: 1,
      exp: 0,
      lastLogin: new Date().toISOString(),
      streakDays: 1,
    }

    users[newUser.uid] = newUser
    saveUsers(users)
    login(newUser)
    initUnlock(newUser.uid, 1, 101)

    return { success: true, message: '가입 완료!' }
  }

  const signIn = async (nickname: string, pin: string): Promise<{ success: boolean; message: string }> => {
    const users = loadUsers()
    const found = Object.values(users).find(
      (u) => u.nickname === nickname.trim() && u.pin === pin
    )

    if (!found) {
      return { success: false, message: '닉네임 또는 비밀번호가 틀렸어요' }
    }

    // 출석 보너스 체크
    const { bonus, newStreak, isFirstToday } = checkDailyBonus(found.lastLogin, found.streakDays)

    const updatedUser: User = {
      ...found,
      lastLogin: new Date().toISOString(),
      streakDays: newStreak,
      exp: found.exp + bonus,
    }
    users[updatedUser.uid] = updatedUser
    saveUsers(users)
    login(updatedUser)

    const message = isFirstToday
      ? `어서와! 출석 보너스 +${bonus} EXP 획득!`
      : `반가워, ${found.nickname}!`

    return { success: true, message }
  }

  const signOut = () => {
    storeLogout()
  }

  return {
    user,
    isLoggedIn,
    register,
    signIn,
    signOut,
  }
}

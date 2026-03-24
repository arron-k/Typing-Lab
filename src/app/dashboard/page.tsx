'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useProgressStore } from '@/store/useProgressStore'
import { getAllStages } from '@/lib/curriculum'
import StageCard from '@/components/dashboard/StageCard'
import LeoAvatar from '@/components/character/LeoAvatar'
import { useState } from 'react'
import type { StageData } from '@/types'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoggedIn, signOut } = useAuth()
  const { progressMap } = useProgressStore()
  const [stages, setStages] = useState<StageData[]>([])

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/login')
      return
    }
    getAllStages().then(setStages)
  }, [isLoggedIn])

  if (!user) return null

  const expToNextLevel = 1000
  const expProgress = user.exp % expToNextLevel
  const expPercent = (expProgress / expToNextLevel) * 100

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
      {/* 상단 헤더 */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LeoAvatar level={user.level} size="sm" />
            <div>
              <div className="font-bold text-gray-800 text-sm">{user.nickname}</div>
              <div className="text-xs text-gray-500">Lv.{user.level} · {user.exp} EXP</div>
            </div>
          </div>

          {/* EXP 바 */}
          <div className="flex-1 mx-4 hidden sm:block">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all duration-700"
                  style={{ width: `${expPercent}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {expProgress} / {expToNextLevel}
              </span>
            </div>
          </div>

          {/* 연속 출석 */}
          <div className="flex items-center gap-2">
            {user.streakDays > 1 && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold">
                🔥 {user.streakDays}일 연속
              </span>
            )}
            <button
              onClick={() => { signOut(); router.push('/login') }}
              className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div className="text-center py-4">
          <h1 className="text-2xl font-bold text-gray-800">📚 학습 맵</h1>
          <p className="text-sm text-gray-500 mt-1">
            레오와 함께 타이핑을 연습하고 과학 지식을 쌓아봐!
          </p>
        </div>

        {stages.map((stage) => (
          <StageCard
            key={stage.id}
            stage={stage}
            progressMap={progressMap}
            uid={user.uid}
          />
        ))}
      </main>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useTypingStore } from '@/store/useTypingStore'
import { useProgressStore } from '@/store/useProgressStore'
import { useUserStore } from '@/store/useUserStore'
import { getStep, getNextStep } from '@/lib/curriculum'
import TypingArea from '@/components/typing/TypingArea'
import CardTypingArea from '@/components/typing/CardTypingArea'
import ResultModal from '@/components/typing/ResultModal'
import LeoAvatar from '@/components/character/LeoAvatar'
import type { StepData, SessionResult } from '@/types'
import Link from 'next/link'

export default function StepPage() {
  const router = useRouter()
  const params = useParams()
  const stageId = Number(params.stageId)
  const stepId = Number(params.stepId)

  const { user, isLoggedIn } = useAuth()
  const { updateProgress } = useProgressStore()
  const { addExp } = useUserStore()
  const typingStore = useTypingStore()

  const [stepData, setStepData] = useState<StepData | null>(null)
  const [currentTypingIndex, setCurrentTypingIndex] = useState(0)
  const [result, setResult] = useState<SessionResult | null>(null)
  const [hasNext, setHasNext] = useState(false)
  const [nextStepData, setNextStepData] = useState<StepData | null>(null)

  useEffect(() => {
    if (!isLoggedIn) { router.replace('/login'); return }

    getStep(stepId).then(async (step) => {
      if (!step) { router.replace('/dashboard'); return }
      setStepData(step)
      setCurrentTypingIndex(0)
      setResult(null)

      const next = await getNextStep(stageId, stepId)
      setNextStepData(next)
      setHasNext(!!next)
    })
  }, [stageId, stepId, isLoggedIn])

  if (!user || !stepData) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-500 text-lg">불러오는 중...</div>
    </div>
  )

  const currentTypingData = stepData.typingData[currentTypingIndex]

  const handleTypingComplete = () => {
    const isLastTypingData = currentTypingIndex >= stepData.typingData.length - 1

    if (!isLastTypingData) {
      // 같은 스텝의 다음 타이핑 데이터로 이동
      setCurrentTypingIndex((prev) => prev + 1)
      return
    }

    // 스텝의 모든 타이핑 완료 → 결과 계산
    const sessionResult = typingStore.finishSession()
    setResult(sessionResult)

    // 진행도 & EXP 업데이트
    updateProgress(user.uid, sessionResult)
    addExp(sessionResult.expGained)
  }

  const handleRetry = () => {
    setResult(null)
    setCurrentTypingIndex(0)
    typingStore.reset()
  }

  const handleNext = () => {
    if (hasNext && nextStepData) {
      router.push(`/stage/${stageId}/${nextStepData.id}`)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-blue-50">
      {/* 상단 네비게이션 */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-700 text-xl">←</Link>
          <div className="flex-1">
            <h2 className="font-bold text-gray-800 text-sm">{stepData.title}</h2>
            <div className="text-xs text-gray-400">
              Stage {stageId} · {currentTypingIndex + 1} / {stepData.typingData.length}
            </div>
          </div>
          <LeoAvatar level={user.level} size="sm" />
        </div>

        {/* 진행 바 */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-1 bg-blue-500 transition-all duration-500"
            style={{ width: `${((currentTypingIndex + 1) / stepData.typingData.length) * 100}%` }}
          />
        </div>
      </header>

      {/* 타이핑 영역 */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {currentTypingData && (
          currentTypingData.displayMode === 'card'
            ? <CardTypingArea
                key={`${stepId}-${currentTypingIndex}`}
                typingData={currentTypingData}
                stageId={stageId}
                stepId={stepId}
                targetKeys={stepData.targetKeys}
                onComplete={handleTypingComplete}
              />
            : <TypingArea
                key={`${stepId}-${currentTypingIndex}`}
                typingData={currentTypingData}
                stageId={stageId}
                stepId={stepId}
                targetKeys={stepData.targetKeys}
                onComplete={handleTypingComplete}
              />
        )}
      </main>

      {/* 결과 모달 */}
      {result && (
        <ResultModal
          result={result}
          onRetry={handleRetry}
          onNext={handleNext}
          hasNext={hasNext}
        />
      )}
    </div>
  )
}

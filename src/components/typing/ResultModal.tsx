'use client'

import { useEffect, useState } from 'react'
import type { SessionResult } from '@/types'

interface ResultModalProps {
  result: SessionResult
  onRetry: () => void
  onNext: () => void
  hasNext: boolean
}

export default function ResultModal({ result, onRetry, onNext, hasNext }: ResultModalProps) {
  const [visibleStars, setVisibleStars] = useState(0)
  const [showExp, setShowExp] = useState(false)
  const [displayExp, setDisplayExp] = useState(0)

  // 별 순차 등장 애니메이션
  useEffect(() => {
    setVisibleStars(0)
    setShowExp(false)
    setDisplayExp(0)

    const timers: ReturnType<typeof setTimeout>[] = []

    for (let i = 1; i <= 3; i++) {
      timers.push(
        setTimeout(() => {
          if (i <= result.stars) setVisibleStars(i)
          else setVisibleStars((prev) => (prev < i ? prev : prev))
        }, i * 350)
      )
    }

    timers.push(
      setTimeout(() => {
        setShowExp(true)
        // EXP 카운트업
        let current = 0
        const target = result.expGained
        const step = Math.ceil(target / 30)
        const interval = setInterval(() => {
          current = Math.min(current + step, target)
          setDisplayExp(current)
          if (current >= target) clearInterval(interval)
        }, 33)
      }, 1400)
    )

    return () => timers.forEach(clearTimeout)
  }, [result])

  const leoEmoji = result.stars === 3 ? '🏆' : result.stars === 2 ? '😄' : result.stars >= 1 ? '😊' : '😅'
  const message =
    result.stars === 3 ? '완벽해! 대단한걸!' :
    result.stars === 2 ? '잘했어! 조금만 더!' :
    result.stars >= 1 ? '클리어! 다음 스텝으로!' :
    '아쉽지만 다시 해보자!'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center animate-[star-pop_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)]">
        {/* 레오 반응 */}
        <div className="text-6xl mb-2">{leoEmoji}</div>
        <p className="text-lg font-bold text-gray-800 mb-5">{message}</p>

        {/* 별점 */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className={`text-4xl transition-all duration-300 ${
                i <= visibleStars
                  ? 'opacity-100 animate-[star-pop_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)]'
                  : 'opacity-20 grayscale'
              }`}
            >
              ⭐
            </span>
          ))}
        </div>

        {/* 세부 결과 */}
        <div className="grid grid-cols-3 gap-3 mb-5 text-sm">
          <div className="bg-blue-50 rounded-xl p-3">
            <div className="text-2xl font-bold text-blue-700">{result.wpm}</div>
            <div className="text-blue-500 font-medium">WPM</div>
          </div>
          <div className="bg-green-50 rounded-xl p-3">
            <div className="text-2xl font-bold text-green-700">{result.accuracy}%</div>
            <div className="text-green-500 font-medium">정확도</div>
          </div>
          <div className="bg-red-50 rounded-xl p-3">
            <div className="text-2xl font-bold text-red-700">{result.mistakeCount}</div>
            <div className="text-red-500 font-medium">오타</div>
          </div>
        </div>

        {/* EXP 획득 */}
        {showExp && (
          <div className="bg-yellow-50 rounded-xl py-3 px-4 mb-5 animate-[count-up_1s_ease-out]">
            <span className="text-yellow-700 font-bold text-lg">
              ✨ +{displayExp} EXP 획득!
            </span>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors cursor-pointer"
          >
            다시하기
          </button>
          {hasNext && (
            <button
              onClick={onNext}
              className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors cursor-pointer"
            >
              다음 →
            </button>
          )}
          {!hasNext && result.stars >= 1 && (
            <button
              onClick={onNext}
              className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors cursor-pointer"
            >
              완료 🎉
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

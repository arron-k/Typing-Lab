'use client'

import Link from 'next/link'
import type { Progress, StepData } from '@/types'

interface StepNodeProps {
  step: StepData
  progress: Progress
}

export default function StepNode({ step, progress }: StepNodeProps) {
  const { isUnlocked, highestStars } = progress

  const stars = Array.from({ length: 3 }, (_, i) => i < highestStars ? '⭐' : '☆')

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center gap-1.5 opacity-50">
        <div className="w-14 h-14 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center text-2xl">
          🔒
        </div>
        <div className="text-xs text-gray-400 text-center max-w-16 leading-tight">{step.title}</div>
      </div>
    )
  }

  const ringColor =
    highestStars === 3 ? 'border-yellow-400 bg-yellow-50 shadow-[0_0_10px_rgba(250,204,21,0.5)]' :
    highestStars >= 1 ? 'border-blue-400 bg-blue-50' :
    'border-gray-300 bg-white hover:border-blue-300'

  return (
    <Link href={`/stage/${step.stageId}/${step.id}`}>
      <div className="flex flex-col items-center gap-1.5 cursor-pointer group">
        <div
          className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-xl font-bold transition-all group-hover:scale-110 ${ringColor}`}
        >
          {highestStars === 0 ? '▶' : <span className="text-xs">{stars.join('')}</span>}
        </div>
        <div className="text-xs text-gray-600 text-center max-w-16 leading-tight font-medium">
          {step.title}
        </div>
      </div>
    </Link>
  )
}

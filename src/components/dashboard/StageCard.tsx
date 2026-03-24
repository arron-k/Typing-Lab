'use client'

import StepNode from './StepNode'
import type { StageData, Progress } from '@/types'

interface StageCardProps {
  stage: StageData
  progressMap: Record<string, Progress>
  uid: string
}

const STAGE_COLORS = [
  'from-blue-50 to-blue-100 border-blue-200',
  'from-green-50 to-green-100 border-green-200',
  'from-purple-50 to-purple-100 border-purple-200',
  'from-orange-50 to-orange-100 border-orange-200',
]

const STAGE_ICONS = ['🏠', '📝', '📖', '📚']

export default function StageCard({ stage, progressMap, uid }: StageCardProps) {
  const colorClass = STAGE_COLORS[(stage.id - 1) % STAGE_COLORS.length]
  const icon = STAGE_ICONS[(stage.id - 1) % STAGE_ICONS.length]

  const totalSteps = stage.steps.length
  const completedSteps = stage.steps.filter((step) => {
    const key = `${stage.id}-${step.id}`
    return (progressMap[key]?.highestStars ?? 0) >= 1
  }).length

  const allPerfect = stage.steps.every((step) => {
    const key = `${stage.id}-${step.id}`
    return (progressMap[key]?.highestStars ?? 0) === 3
  })

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${colorClass} p-5`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="font-bold text-gray-800">{stage.title}</h3>
            <p className="text-xs text-gray-500">{stage.description}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-gray-700">
            {completedSteps} / {totalSteps}
          </div>
          {allPerfect && completedSteps === totalSteps && (
            <div className="text-xs text-yellow-600 font-medium">✨ 완벽!</div>
          )}
        </div>
      </div>

      {/* 진행 바 */}
      <div className="w-full bg-white/60 rounded-full h-2 mb-4">
        <div
          className="h-2 rounded-full bg-blue-500 transition-all duration-500"
          style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
        />
      </div>

      {/* 스텝 노드들 */}
      <div className="flex flex-wrap gap-4 justify-start">
        {stage.steps
          .sort((a, b) => a.order - b.order)
          .map((step) => {
            const key = `${stage.id}-${step.id}`
            const progress: Progress = progressMap[key] ?? {
              uid,
              stageId: stage.id,
              stepId: step.id,
              highestStars: 0,
              highestWpm: 0,
              isUnlocked: stage.id === 1 && step.id === 101,
            }
            return <StepNode key={step.id} step={step} progress={progress} />
          })}
      </div>
    </div>
  )
}

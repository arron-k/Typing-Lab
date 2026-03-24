import type { StageData, StepData } from '@/types'

import stage1 from '@/data/stages/stage1.json'
import stage2 from '@/data/stages/stage2.json'
import stage3 from '@/data/stages/stage3.json'
import stage4 from '@/data/stages/stage4.json'

// Phase 1: JSON 직접 import
// Phase 2: 아래 함수 내부만 Supabase 쿼리로 교체 — 호출부 변경 없음
const ALL_STAGES: StageData[] = [
  stage1 as StageData,
  stage2 as StageData,
  stage3 as StageData,
  stage4 as StageData,
]

export async function getAllStages(): Promise<StageData[]> {
  return ALL_STAGES
}

export async function getStage(stageId: number): Promise<StageData | null> {
  return ALL_STAGES.find((s) => s.id === stageId) ?? null
}

export async function getStep(stepId: number): Promise<StepData | null> {
  for (const stage of ALL_STAGES) {
    const step = stage.steps.find((s) => s.id === stepId)
    if (step) return step
  }
  return null
}

export async function getStepsByStage(stageId: number): Promise<StepData[]> {
  const stage = ALL_STAGES.find((s) => s.id === stageId)
  return stage?.steps ?? []
}

export async function getNextStep(
  stageId: number,
  currentStepId: number
): Promise<StepData | null> {
  const stage = ALL_STAGES.find((s) => s.id === stageId)
  if (!stage) return null

  const sorted = [...stage.steps].sort((a, b) => a.order - b.order)
  const currentIndex = sorted.findIndex((s) => s.id === currentStepId)
  if (currentIndex === -1 || currentIndex === sorted.length - 1) return null

  return sorted[currentIndex + 1]
}

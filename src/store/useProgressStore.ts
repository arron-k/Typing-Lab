'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Progress, SessionResult } from '@/types'

interface ProgressState {
  progressMap: Record<string, Progress> // key: `${stageId}-${stepId}`

  getProgress: (stageId: number, stepId: number) => Progress
  updateProgress: (uid: string, result: SessionResult) => void
  isUnlocked: (stageId: number, stepId: number) => boolean
  initUnlock: (uid: string, stageId: number, stepId: number) => void
}

function makeKey(stageId: number, stepId: number) {
  return `${stageId}-${stepId}`
}

const DEFAULT_PROGRESS = (
  uid: string,
  stageId: number,
  stepId: number,
  isUnlocked: boolean
): Progress => ({
  uid,
  stageId,
  stepId,
  highestStars: 0,
  highestWpm: 0,
  isUnlocked,
})

// Stage 1의 첫 스텝(101)은 항상 해금된 상태로 시작
const INITIALLY_UNLOCKED: Record<string, boolean> = { '1-101': true }

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progressMap: {},

      getProgress: (stageId, stepId) => {
        const { progressMap } = get()
        const key = makeKey(stageId, stepId)
        return (
          progressMap[key] ??
          DEFAULT_PROGRESS(
            '',
            stageId,
            stepId,
            INITIALLY_UNLOCKED[key] ?? false
          )
        )
      },

      updateProgress: (uid, result) => {
        const { progressMap, getProgress } = get()
        const key = makeKey(result.stageId, result.stepId)
        const existing = getProgress(result.stageId, result.stepId)

        const updated: Progress = {
          uid,
          stageId: result.stageId,
          stepId: result.stepId,
          highestStars: Math.max(existing.highestStars, result.stars),
          highestWpm: Math.max(existing.highestWpm, result.wpm),
          isUnlocked: true,
        }

        // 별 1개 이상이면 다음 스텝 해금
        const nextStepMap: Record<number, number> = {
          101: 102, 102: 103, 103: 104, 104: 105, 105: 106, 106: 107, 107: 108,
          201: 202, 202: 203, 203: 204, 204: 205, 205: 206, 206: 207, 207: 208, 208: 209, 209: 210,
          301: 302, 302: 303, 303: 304, 304: 305, 305: 306, 306: 307, 307: 308,
          401: 402, 402: 403, 403: 404, 404: 405, 405: 406,
        }

        const newProgressMap = { ...progressMap, [key]: updated }

        if (result.stars >= 1) {
          const nextStepId = nextStepMap[result.stepId]
          if (nextStepId) {
            const nextKey = makeKey(result.stageId, nextStepId)
            const nextExisting = progressMap[nextKey]
            if (!nextExisting?.isUnlocked) {
              newProgressMap[nextKey] = DEFAULT_PROGRESS(uid, result.stageId, nextStepId, true)
            }
          }

          // 스테이지 마지막 스텝 클리어 시 다음 스테이지 첫 스텝 해금
          const lastSteps: Record<number, [number, number]> = {
            108: [2, 201],
            210: [3, 301],
            308: [4, 401],
          }
          const nextStageInfo = lastSteps[result.stepId]
          if (nextStageInfo) {
            const [nextStageId, nextStageFirstStepId] = nextStageInfo
            const nextStageKey = makeKey(nextStageId, nextStageFirstStepId)
            if (!progressMap[nextStageKey]?.isUnlocked) {
              newProgressMap[nextStageKey] = DEFAULT_PROGRESS(uid, nextStageId, nextStageFirstStepId, true)
            }
          }
        }

        set({ progressMap: newProgressMap })
      },

      isUnlocked: (stageId, stepId) => {
        const key = makeKey(stageId, stepId)
        if (INITIALLY_UNLOCKED[key]) return true
        const { progressMap } = get()
        return progressMap[key]?.isUnlocked ?? false
      },

      initUnlock: (uid, stageId, stepId) => {
        const key = makeKey(stageId, stepId)
        const { progressMap } = get()
        if (!progressMap[key]) {
          set({
            progressMap: {
              ...progressMap,
              [key]: DEFAULT_PROGRESS(uid, stageId, stepId, true),
            },
          })
        }
      },
    }),
    {
      name: 'typing-lab-progress',
    }
  )
)

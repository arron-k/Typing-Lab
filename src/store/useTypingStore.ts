'use client'

import { create } from 'zustand'
import type { QuizState, SessionResult } from '@/types'
import { deleteLastJamo } from '@/lib/hangul'
import { calcWPM, calcAccuracy, calcStars, calcExp } from '@/lib/scoring'
import { disassemble } from 'es-hangul'

interface TypingState {
  // 텍스트 상태
  currentText: string
  userInput: string
  cursorIndex: number
  mistakes: number
  isComposing: boolean
  totalTypedChars: number  // card 모드: 이전 토큰 완성 문자 수 누적

  // 타이밍
  startTime: number | null
  endTime: number | null

  // 실시간 계산값
  wpm: number
  accuracy: number

  // 퀴즈
  activeQuiz: QuizState | null
  quizResults: QuizState[]

  // 세션 메타
  stageId: number
  stepId: number
  isCompleted: boolean
  isShaking: boolean   // 오타 shake 트리거

  // 액션
  initSession: (text: string, stageId: number, stepId: number) => void
  initToken: (text: string) => void
  handleInput: (value: string) => void
  handleCompositionStart: () => void
  handleCompositionEnd: (value: string) => void
  handleBackspace: () => void
  selectQuizAnswer: (placeholderKey: string, answer: string) => void
  dismissShake: () => void
  finishSession: () => SessionResult
  reset: () => void
}

const initialState = {
  currentText: '',
  userInput: '',
  cursorIndex: 0,
  mistakes: 0,
  isComposing: false,
  totalTypedChars: 0,
  startTime: null,
  endTime: null,
  wpm: 0,
  accuracy: 100,
  activeQuiz: null,
  quizResults: [],
  stageId: 1,
  stepId: 101,
  isCompleted: false,
  isShaking: false,
}

export const useTypingStore = create<TypingState>((set, get) => ({
  ...initialState,

  initSession: (text, stageId, stepId) => {
    set({
      ...initialState,
      currentText: text,
      stageId,
      stepId,
    })
  },

  initToken: (text: string) => {
    const { currentText, totalTypedChars } = get()
    set({
      currentText: text,
      userInput: '',
      cursorIndex: 0,
      isCompleted: false,
      isShaking: false,
      isComposing: false,
      totalTypedChars: totalTypedChars + currentText.length,
    })
  },

  handleCompositionStart: () => {
    set({ isComposing: true })
  },

  handleCompositionEnd: (value: string) => {
    set({ isComposing: false })
    get().handleInput(value)
  },

  handleInput: (value: string) => {
    const { currentText, mistakes, startTime, isCompleted: alreadyCompleted } = get()
    if (alreadyCompleted) return

    // 첫 입력 시 타이머 시작
    const newStartTime = startTime ?? Date.now()

    const newCursorIndex = value.length
    let newMistakes = mistakes

    // 자모 단위 오타 판정 — 새로 추가된 자모만 검사해 이중 집계 방지
    // handleInput은 누적 전체값으로 호출되므로, 이전 userInput의 자모 수 이후만 비교
    // 예) userInput="가나", 새 value="가나라" → 새 자모 ["ㄹ","ㅏ"]만 검사
    if (value.length > 0) {
      const targetJamo = Array.from(disassemble(currentText))
      const inputJamo = Array.from(disassemble(value))
      const prevJamoCount = Array.from(disassemble(get().userInput)).length
      const newJamo = inputJamo.slice(prevJamoCount)
      const hasMismatch = newJamo.some((j, idx) => j !== targetJamo[prevJamoCount + idx])
      if (hasMismatch) {
        newMistakes = mistakes + 1
        set({ isShaking: true })
        setTimeout(() => set({ isShaking: false }), 300)
      }
    }

    const durationMs = Date.now() - newStartTime
    const newWpm = calcWPM(value.length, durationMs)
    const newAccuracy = calcAccuracy(value.length, newMistakes)

    const newIsCompleted = newCursorIndex >= currentText.length

    set({
      userInput: value,
      cursorIndex: newCursorIndex,
      mistakes: newMistakes,
      startTime: newStartTime,
      wpm: newWpm,
      accuracy: newAccuracy,
      isCompleted: newIsCompleted,
      endTime: newIsCompleted ? Date.now() : null,
    })
  },

  handleBackspace: () => {
    const { userInput, isCompleted } = get()
    if (isCompleted || userInput.length === 0) return

    const newInput = deleteLastJamo(userInput)

    set({
      userInput: newInput,
      cursorIndex: newInput.length,
    })
  },

  selectQuizAnswer: (placeholderKey, answer) => {
    const { activeQuiz, quizResults } = get()
    if (!activeQuiz || activeQuiz.placeholderKey !== placeholderKey) return

    const isCorrect = activeQuiz.selectedAnswer === answer
    const updatedQuiz: QuizState = {
      ...activeQuiz,
      selectedAnswer: answer,
      isCorrect,
    }

    set({
      activeQuiz: null,
      quizResults: [...quizResults, updatedQuiz],
    })
  },

  dismissShake: () => set({ isShaking: false }),

  finishSession: () => {
    const {
      currentText,
      totalTypedChars,
      mistakes,
      startTime,
      endTime,
      quizResults,
      stageId,
      stepId,
    } = get()

    const duration = (endTime ?? Date.now()) - (startTime ?? Date.now())
    const totalChars = totalTypedChars > 0 ? totalTypedChars + currentText.length : currentText.length
    const wpm = calcWPM(totalChars, duration)
    const accuracy = calcAccuracy(totalChars, mistakes)

    const totalQuizzes = quizResults.length
    const correctQuizzes = quizResults.filter((q) => q.isCorrect).length
    const quizScore = totalQuizzes === 0 ? 100 : Math.round((correctQuizzes / totalQuizzes) * 100)

    const result: Omit<SessionResult, 'stars' | 'expGained'> = {
      stageId,
      stepId,
      wpm,
      accuracy,
      mistakeCount: mistakes,
      quizScore,
      durationMs: duration,
    }

    const stars = calcStars(stageId, result)
    const expGained = calcExp(totalChars, accuracy, stageId, stars)

    const sessionResult: SessionResult = { ...result, stars, expGained }

    set({ endTime: Date.now() })
    return sessionResult
  },

  reset: () => set(initialState),
}))

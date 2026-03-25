'use client'

import { create } from 'zustand'
import type { QuizState, SessionResult } from '@/types'
import { deleteLastJamo } from '@/lib/hangul'
import { calcWPM, calcAccuracy, calcStars, calcExp } from '@/lib/scoring'

interface TypingState {
  // 텍스트 상태
  currentText: string
  userInput: string
  cursorIndex: number
  mistakes: number
  isComposing: boolean

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
  handleInput: (value: string) => void
  handleCompositionStart: () => void
  handleCompositionEnd: () => void
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

  handleCompositionStart: () => {
    set({ isComposing: true })
  },

  handleCompositionEnd: () => {
    set({ isComposing: false })
    // onChange가 compositionEnd 직후 발화되어 handleInput을 단독 처리
  },

  handleInput: (value: string) => {
    const { currentText, mistakes, startTime, isCompleted: alreadyCompleted } = get()
    if (alreadyCompleted) return

    // 첫 입력 시 타이머 시작
    const newStartTime = startTime ?? Date.now()

    const newCursorIndex = value.length
    let newMistakes = mistakes

    // 새로 입력된 마지막 글자가 오타인지 확인
    if (value.length > 0 && value.length <= currentText.length) {
      const lastInputChar = value[value.length - 1]
      const targetChar = currentText[value.length - 1]
      if (lastInputChar !== targetChar) {
        newMistakes = mistakes + 1
        set({ isShaking: true })
        // 300ms 후 shake 해제
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
      mistakes,
      startTime,
      endTime,
      quizResults,
      stageId,
      stepId,
    } = get()

    const duration = (endTime ?? Date.now()) - (startTime ?? Date.now())
    const wpm = calcWPM(currentText.length, duration)
    const accuracy = calcAccuracy(currentText.length, mistakes)

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
    const expGained = calcExp(currentText.length, accuracy, stageId, stars)

    const sessionResult: SessionResult = { ...result, stars, expGained }

    set({ endTime: Date.now() })
    return sessionResult
  },

  reset: () => set(initialState),
}))

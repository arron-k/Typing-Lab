'use client'

import { useCallback, useEffect } from 'react'
import { useTypingStore } from '@/store/useTypingStore'

/**
 * 타이핑 엔진 이벤트 핸들러 훅
 * IME(한글 조합) 처리 + 백스페이스 오토마타 로직 통합
 */
export function useTypingEngine() {
  const store = useTypingStore()

  // 페이지 언마운트 시 스토어 초기화
  useEffect(() => {
    return () => {
      store.reset()
    }
  }, [])

  const onCompositionStart = useCallback(() => {
    store.handleCompositionStart()
  }, [store])

  const onCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      store.handleCompositionEnd(e.currentTarget.value)
    },
    [store]
  )

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // IME 조합 중 Enter/Space 중복 이벤트 방지
      if (store.isComposing && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        return
      }

      // 백스페이스: 한글 오토마타 분해 처리
      if (e.key === 'Backspace') {
        e.preventDefault()
        store.handleBackspace()
      }
    },
    [store]
  )

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // IME compositionEnd 후 중복 호출 방지
      if (store.isComposing) return
      store.handleInput(e.target.value)
    },
    [store]
  )

  return {
    // input 엘리먼트에 바인딩할 이벤트 핸들러
    inputHandlers: {
      onCompositionStart,
      onCompositionEnd,
      onKeyDown,
      onChange,
    },
    // 현재 타이핑 상태
    state: {
      userInput:   store.userInput,
      cursorIndex: store.cursorIndex,
      mistakes:    store.mistakes,
      wpm:         store.wpm,
      accuracy:    store.accuracy,
      isCompleted: store.isCompleted,
      isShaking:   store.isShaking,
    },
  }
}

'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useTypingStore } from '@/store/useTypingStore'

/**
 * 타이핑 엔진 이벤트 핸들러 훅
 * IME(한글 조합) 처리 + 백스페이스 오토마타 로직 통합
 */
export function useTypingEngine() {
  const store = useTypingStore()
  // store.isComposing은 stale closure 문제가 있으므로 ref로 동기 추적
  const isComposingRef = useRef(false)

  // 페이지 언마운트 시 스토어 초기화
  useEffect(() => {
    return () => {
      store.reset()
    }
  }, [])

  const onCompositionStart = useCallback(() => {
    isComposingRef.current = true
    store.handleCompositionStart()
  }, [store])

  const onCompositionEnd = useCallback(
    (_e: React.CompositionEvent<HTMLInputElement>) => {
      isComposingRef.current = false
      store.handleCompositionEnd()
      // handleInput은 compositionEnd 직후 발화되는 onChange에서 처리
    },
    [store]
  )

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // IME 조합 중 Enter/Space 중복 이벤트 방지
      if (isComposingRef.current && (e.key === 'Enter' || e.key === ' ')) {
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
      // ref 기준으로 조합 중 여부 판단 (stale closure 방지)
      if (isComposingRef.current) return
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

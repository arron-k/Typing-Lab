'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTypingStore } from '@/store/useTypingStore'
import { useTypingEngine } from '@/hooks/useTypingEngine'
import CardDisplay from './CardDisplay'
import VirtualKeyboard from '@/components/keyboard/VirtualKeyboard'
import type { TypingData } from '@/types'
import { disassemble, assemble } from 'es-hangul'

interface CardTypingAreaProps {
  typingData: TypingData
  stageId: number
  stepId: number
  targetKeys: string[]
  onComplete: () => void
}

const HANGUL_KEY_MAP: Record<string, string> = {
  'ㅏ': 'k', 'ㅓ': 'j', 'ㅣ': 'l', 'ㅗ': 'h',
  'ㅕ': 'u', 'ㅛ': 'y', 'ㅑ': 'i', 'ㅐ': 'o', 'ㅔ': 'p',
  'ㅜ': 'n', 'ㅡ': 'm', 'ㅠ': 'b',
  'ㅂ': 'q', 'ㅈ': 'w', 'ㄷ': 'e', 'ㄱ': 'r', 'ㅅ': 't',
  'ㅁ': 'a', 'ㄴ': 's', 'ㅇ': 'd', 'ㄹ': 'f', 'ㅎ': 'g',
  'ㅋ': 'z', 'ㅌ': 'x', 'ㅊ': 'c', 'ㅍ': 'v',
  'ㅃ': 'q', 'ㅉ': 'w', 'ㄸ': 'e', 'ㄲ': 'r', 'ㅆ': 't',
  'ㅒ': 'o', 'ㅖ': 'p',
  ' ': ' ',
}

const SHIFT_JAMO_MAP: Record<string, { key: string; shift: 'shift-l' | 'shift-r' }> = {
  'ㅃ': { key: 'q', shift: 'shift-r' },
  'ㅉ': { key: 'w', shift: 'shift-r' },
  'ㄸ': { key: 'e', shift: 'shift-r' },
  'ㄲ': { key: 'r', shift: 'shift-r' },
  'ㅆ': { key: 't', shift: 'shift-r' },
  'ㅒ': { key: 'o', shift: 'shift-l' },
  'ㅖ': { key: 'p', shift: 'shift-l' },
}

function getNextKeys(targetText: string, inputValue: string): string[] {
  if (!targetText) return []
  const targetJamo = disassemble(targetText)
  const inputJamo = disassemble(inputValue)
  if (inputJamo.length >= targetJamo.length) return []
  const nextJamo = targetJamo[inputJamo.length]
  if (!nextJamo) return []
  if (nextJamo === ' ') return [' ']
  const shiftEntry = SHIFT_JAMO_MAP[nextJamo]
  if (shiftEntry) return [shiftEntry.shift, shiftEntry.key]
  return [HANGUL_KEY_MAP[nextJamo] ?? nextJamo.toLowerCase()]
}

export default function CardTypingArea({
  typingData, stageId, stepId, targetKeys, onComplete,
}: CardTypingAreaProps) {
  const tokens = typingData.text.split(' ').filter(Boolean)
  const [tokenIndex, setTokenIndex] = useState(0)
  // useEffect 비동기 지연 없이 이벤트 핸들러에서 즉시 참조하기 위한 ref
  const tokenIndexRef = useRef(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const isComposingRef = useRef(false)
  const compositionBaseRef = useRef('')
  const needsDomSyncRef = useRef(false)

  const store = useTypingStore()
  const { inputHandlers, state } = useTypingEngine()
  const [composingChar, setComposingChar] = useState('')

  const currentToken = tokens[tokenIndex] ?? ''
  const upcomingTokens = tokens.slice(tokenIndex + 1)

  // 세션 초기화 (첫 토큰)
  useEffect(() => {
    store.initSession(tokens[0], stageId, stepId)
    tokenIndexRef.current = 0
    setTokenIndex(0)
    setComposingChar('')
    if (inputRef.current) inputRef.current.value = ''
    inputRef.current?.focus()
  }, [typingData.id])

  // 백스페이스 후 DOM 동기화
  useEffect(() => {
    if (needsDomSyncRef.current && inputRef.current) {
      inputRef.current.value = state.userInput
      needsDomSyncRef.current = false
    }
  }, [state.userInput])

  // 토큰 완료 시 동기적으로 다음 토큰으로 전환
  // useEffect 대신 이벤트 핸들러에서 직접 호출해 DOM 초기화가 즉시 이루어지도록 함
  // 이유: useEffect는 paint 이후 비동기 실행되므로, 빠른 타이핑 시
  //       다음 토큰의 compositionStart가 DOM 초기화 전에 발생할 수 있음
  //       → compositionBaseRef에 이전 토큰 텍스트가 남아 오타 오판정 발생
  const advanceToken = useCallback(() => {
    const nextIndex = tokenIndexRef.current + 1
    if (nextIndex >= tokens.length) {
      onComplete()
    } else {
      tokenIndexRef.current = nextIndex
      setTokenIndex(nextIndex)
      store.initToken(tokens[nextIndex])
      setComposingChar('')
      if (inputRef.current) inputRef.current.value = ''
    }
  }, [tokens, onComplete, store])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // 카드 모드: 스페이스/엔터는 토큰 진행 키로 처리 — store에 전달하면 오타 판정됨
    if ((e.key === ' ' || e.key === 'Enter') && !isComposingRef.current) {
      e.preventDefault()
      if (useTypingStore.getState().isCompleted) {
        advanceToken()
      }
      return
    }
    if (e.key === 'Backspace' && !isComposingRef.current) {
      needsDomSyncRef.current = true
    }
    inputHandlers.onKeyDown(e)
  }, [inputHandlers, advanceToken])

  const handleCompositionStart = useCallback(() => {
    compositionBaseRef.current = useTypingStore.getState().userInput
    isComposingRef.current = true
    inputHandlers.onCompositionStart()
  }, [inputHandlers])

  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false
    setComposingChar('')
    inputHandlers.onCompositionEnd(e)
    // 토큰 완료 감지: compositionEnd 직후 동기적으로 확인
    if (useTypingStore.getState().isCompleted) {
      advanceToken()
    }
  }, [inputHandlers, advanceToken])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (isComposingRef.current) {
      const baseJamoCount = Array.from(disassemble(compositionBaseRef.current)).length
      const inputJamo = Array.from(disassemble(e.target.value))
      const newJamo = inputJamo.slice(baseJamoCount)
      setComposingChar(newJamo.length > 0 ? assemble(newJamo) : '')
    } else {
      setComposingChar('')
      inputHandlers.onChange(e)
      // 비조합 입력(영문 등)에서의 토큰 완료도 동기 처리
      if (useTypingStore.getState().isCompleted) {
        advanceToken()
      }
    }
  }, [inputHandlers, advanceToken])

  const inputValue = state.userInput + composingChar
  const nextKeys = getNextKeys(currentToken, inputValue)
  const showStats = store.startTime !== null

  return (
    <div className="flex flex-col gap-4" onClick={() => inputRef.current?.focus()}>
      {showStats && (
        <div className="flex gap-6 text-sm font-semibold text-gray-600 px-1">
          <span>❌ {state.mistakes}회</span>
        </div>
      )}

      <CardDisplay
        currentToken={currentToken}
        confirmedInput={state.userInput}
        composingChar={composingChar}
        isComposing={state.isComposing}
        isShaking={state.isShaking}
        upcomingTokens={upcomingTokens}
        tokenIndex={tokenIndex}
        totalTokens={tokens.length}
      />

      {/* 숨김 입력창 — 비제어 방식으로 한글 IME 보호 */}
      <input
        ref={inputRef}
        type="text"
        defaultValue=""
        className="fixed opacity-0 top-[-100px] left-[-100px] w-px h-px"
        aria-hidden="true"
        {...inputHandlers}
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onChange={handleChange}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      <p className="text-xs text-gray-400 text-center cursor-text">
        화면을 클릭하면 타이핑을 시작할 수 있어요
      </p>

      <VirtualKeyboard nextKeys={nextKeys} />
    </div>
  )
}

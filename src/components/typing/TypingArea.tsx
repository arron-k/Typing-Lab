'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTypingStore } from '@/store/useTypingStore'
import { useTypingEngine } from '@/hooks/useTypingEngine'
import TypingText from './TypingText'
import QuizPopup from './QuizPopup'
import VirtualKeyboard from '@/components/keyboard/VirtualKeyboard'
import type { TypingData } from '@/types'
import { useSettingsStore } from '@/store/useSettingsStore'

interface TypingAreaProps {
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
  ' ': ' ',
}

function getNextKeyForChar(char: string): string {
  if (char === ' ') return ' '
  return HANGUL_KEY_MAP[char] ?? char.toLowerCase()
}

function parseTextWithQuiz(text: string): Array<{ type: 'text' | 'quiz'; content: string; key?: string }> {
  const parts: Array<{ type: 'text' | 'quiz'; content: string; key?: string }> = []
  const regex = /\[([^\]]+)\]/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'quiz', content: match[1], key: match[1] })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) })
  }
  return parts
}

export default function TypingArea({
  typingData, stageId, stepId, targetKeys, onComplete,
}: TypingAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const store = useTypingStore()
  const { inputHandlers, state } = useTypingEngine()
  const { showHandOverlay, toggleHandOverlay } = useSettingsStore()

  const [resolvedQuizzes, setResolvedQuizzes] = useState<Record<string, string>>({})
  const [pendingQuizKey, setPendingQuizKey] = useState<string | null>(null)
  // IME 조합 중인 글자 (확정 전) — 타겟 위치에 직접 표시
  const [composingChar, setComposingChar] = useState('')

  const getResolvedText = () => {
    let text = typingData.text
    for (const [key, answer] of Object.entries(resolvedQuizzes)) {
      text = text.replace(`[${key}]`, answer)
    }
    return text
  }

  // 세션 초기화
  useEffect(() => {
    const text = typingData.type === 'normal' ? typingData.text : getResolvedText()
    store.initSession(text, stageId, stepId)
    setComposingChar('')
    if (inputRef.current) inputRef.current.value = ''
    inputRef.current?.focus()
  }, [typingData.id])

  // 백스페이스 후 DOM과 동기화
  useEffect(() => {
    if (!store.isComposing && inputRef.current) {
      inputRef.current.value = state.userInput
    }
  }, [state.userInput])

  // 완료 감지
  useEffect(() => {
    if (state.isCompleted) onComplete()
  }, [state.isCompleted])

  // 퀴즈 플레이스홀더 도달 감지
  useEffect(() => {
    if (typingData.type !== 'quiz' || !typingData.quizOptions) return
    const remaining = store.currentText.slice(state.userInput.length)
    const match = remaining.match(/^\[([^\]]+)\]/)
    if (match) {
      const quizKey = match[1]
      if (!resolvedQuizzes[quizKey] && pendingQuizKey !== quizKey) {
        setPendingQuizKey(quizKey)
      }
    }
  }, [state.userInput])

  const handleQuizSelect = (placeholderKey: string, answer: string) => {
    const newResolved = { ...resolvedQuizzes, [placeholderKey]: answer }
    setResolvedQuizzes(newResolved)
    setPendingQuizKey(null)
    store.selectQuizAnswer(placeholderKey, answer)

    let text = typingData.text
    for (const [key, ans] of Object.entries(newResolved)) {
      text = text.replace(`[${key}]`, ans)
    }
    store.initSession(text, stageId, stepId)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // onChange: 조합 중일 때 composingChar 추출 (확정된 글자 이후 부분)
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (store.isComposing) {
      const composing = e.target.value.slice(state.userInput.length)
      setComposingChar(composing)
    } else {
      setComposingChar('')
      inputHandlers.onChange(e)
    }
  }, [store.isComposing, state.userInput, inputHandlers])

  // compositionEnd 후 composingChar 초기화
  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLInputElement>) => {
    setComposingChar('')
    inputHandlers.onCompositionEnd(e)
  }, [inputHandlers])

  // 가상 키보드: 확정 + 조합 이후 다음 글자 기준으로 키 하이라이트
  const currentText = store.currentText
  const cursorPos = state.userInput.length + (composingChar ? 1 : 0)
  const nextChar = currentText[cursorPos]
  const nextKey = nextChar ? getNextKeyForChar(nextChar) : undefined

  const showStats = store.startTime !== null

  const renderQuizText = () => {
    if (typingData.type !== 'quiz') return null
    const parts = parseTextWithQuiz(typingData.text)

    return (
      <div className="font-mono text-lg leading-relaxed p-4 bg-blue-50 rounded-xl border-2 border-blue-100 mb-3">
        {parts.map((part, i) => {
          if (part.type === 'text') return <span key={i} className="text-gray-700">{part.content}</span>
          const quizKey = part.key!
          const resolved = resolvedQuizzes[quizKey]
          const option = typingData.quizOptions?.[quizKey]

          if (resolved) return <span key={i} className="text-green-600 font-bold underline decoration-green-400">{resolved}</span>
          if (pendingQuizKey === quizKey && option) return <QuizPopup key={i} placeholderKey={quizKey} option={option} onSelect={handleQuizSelect} />
          return <span key={i} className="inline-block px-3 py-0.5 bg-yellow-200 text-yellow-800 rounded font-bold text-sm mx-1">?</span>
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4" onClick={() => inputRef.current?.focus()}>
      {showStats && (
        <div className="flex gap-6 text-sm font-semibold text-gray-600 px-1">
          <span>⚡ {state.wpm} WPM</span>
          <span>🎯 {state.accuracy}%</span>
          <span>❌ {state.mistakes}회</span>
        </div>
      )}

      {typingData.type === 'quiz' && renderQuizText()}

      {/* 숨김 입력창 — 비제어 방식으로 한글 IME 보호 */}
      <input
        ref={inputRef}
        type="text"
        defaultValue=""
        className="fixed opacity-0 top-[-100px] left-[-100px] w-px h-px"
        aria-hidden="true"
        readOnly={pendingQuizKey !== null}
        {...inputHandlers}
        onChange={handleChange}
        onCompositionEnd={handleCompositionEnd}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      {/* 타이핑 텍스트 — 한컴 타자 방식 */}
      {pendingQuizKey === null && (
        <TypingText
          currentText={store.currentText}
          confirmedInput={state.userInput}
          composingChar={composingChar}
          isShaking={state.isShaking}
        />
      )}

      <p className="text-xs text-gray-400 text-center cursor-text">
        화면을 클릭하면 타이핑을 시작할 수 있어요
      </p>

      <div className="flex flex-col gap-1">
        <div className="flex justify-end">
          <button
            onClick={toggleHandOverlay}
            className={`text-xs px-2 py-1 rounded border transition-colors ${
              showHandOverlay
                ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
            }`}
          >
            손 가이드 {showHandOverlay ? 'ON' : 'OFF'}
          </button>
        </div>
        <VirtualKeyboard targetKeys={targetKeys} nextKey={nextKey} />
      </div>
    </div>
  )
}

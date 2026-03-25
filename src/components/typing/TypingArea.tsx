'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTypingStore } from '@/store/useTypingStore'
import { useTypingEngine } from '@/hooks/useTypingEngine'
import TypingText from './TypingText'
import QuizPopup from './QuizPopup'
import VirtualKeyboard from '@/components/keyboard/VirtualKeyboard'
import type { TypingData } from '@/types'
import { disassembleToGroups } from 'es-hangul'

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
  // 쌍자음 + 쌍모음 (Shift 필요)
  'ㅃ': 'q', 'ㅉ': 'w', 'ㄸ': 'e', 'ㄲ': 'r', 'ㅆ': 't',
  'ㅒ': 'o', 'ㅖ': 'p',
  ' ': ' ',
}

// Shift가 필요한 자모 집합 (두벌식 기준)
const SHIFT_JAMO = new Set(['ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ', 'ㅒ', 'ㅖ'])

function getFirstKeys(char: string): string[] {
  if (char === ' ') return [' ']
  if (HANGUL_KEY_MAP[char]) {
    const key = HANGUL_KEY_MAP[char]
    return SHIFT_JAMO.has(char) ? ['shift-l', 'shift-r', key] : [key]
  }

  const code = char.charCodeAt(0)
  if (code >= 0xac00 && code <= 0xd7a3) {
    const firstJamo = disassembleToGroups(char)[0]?.[0]
    if (firstJamo) {
      const key = HANGUL_KEY_MAP[firstJamo] ?? char.toLowerCase()
      return SHIFT_JAMO.has(firstJamo) ? ['shift-l', 'shift-r', key] : [key]
    }
  }

  return [char.toLowerCase()]
}

// 조합 중인 자모 위치를 추적해 다음에 눌러야 할 키 목록 반환
// 쌍자음/쌍모음이면 ['shift-l', 'shift-r', 'q'] 형태로 Shift 포함
function getNextKeys(targetChar: string, composingChar: string): string[] {
  if (!targetChar) return []
  if (!composingChar) return getFirstKeys(targetChar)

  const targetCode = targetChar.charCodeAt(0)
  if (targetCode >= 0xac00 && targetCode <= 0xd7a3) {
    const targetJamos = disassembleToGroups(targetChar)[0] ?? []
    const composingJamos = disassembleToGroups(composingChar)[0] ?? []
    const nextJamo = targetJamos[composingJamos.length]
    if (nextJamo) {
      const key = HANGUL_KEY_MAP[nextJamo] ?? nextJamo.toLowerCase()
      return SHIFT_JAMO.has(nextJamo) ? ['shift-l', 'shift-r', key] : [key]
    }
  }

  return getFirstKeys(targetChar)
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
  const isComposingRef = useRef(false)
  const store = useTypingStore()
  const { inputHandlers, state } = useTypingEngine()
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

  // compositionStart: ref 동기화 후 엔진 핸들러 호출
  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true
    inputHandlers.onCompositionStart()
  }, [inputHandlers])

  // compositionEnd: ref 먼저 false로 설정 → onChange가 handleInput 처리
  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false
    setComposingChar('')
    inputHandlers.onCompositionEnd(e)
  }, [inputHandlers])

  // onChange: ref 기준으로 조합 중 여부 판단 (stale closure 방지)
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (isComposingRef.current) {
      setComposingChar(e.target.value.slice(state.userInput.length))
    } else {
      setComposingChar('')
      inputHandlers.onChange(e)
    }
  }, [state.userInput, inputHandlers])

  const currentText = store.currentText
  const nextKeys = getNextKeys(currentText[state.userInput.length], composingChar)

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
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onChange={handleChange}
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

      <VirtualKeyboard targetKeys={targetKeys} nextKeys={nextKeys} />
    </div>
  )
}

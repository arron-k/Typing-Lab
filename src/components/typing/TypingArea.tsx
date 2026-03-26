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

 claude/typing-learning-service-design-2F4a1
// 쌍자음/쌍모음 → { 기본키, 눌러야 할 Shift 방향 }
// 한컴타자 방식: 타겟 키의 반대쪽 손 Shift를 사용
// 왼손 키(q~t, a~g, z~b) → shift-r / 오른손 키(y~p, h~;, n~m) → shift-l
const SHIFT_JAMO_MAP: Record<string, { key: string; shift: 'shift-l' | 'shift-r' }> = {
  'ㅃ': { key: 'q', shift: 'shift-r' },
  'ㅉ': { key: 'w', shift: 'shift-r' },
  'ㄸ': { key: 'e', shift: 'shift-r' },
  'ㄲ': { key: 'r', shift: 'shift-r' },
  'ㅆ': { key: 't', shift: 'shift-r' },
  'ㅒ': { key: 'o', shift: 'shift-l' },
  'ㅖ': { key: 'p', shift: 'shift-l' },
}

function getFirstKeys(char: string): string[] {
  if (char === ' ') return [' ']
  const shiftEntry = SHIFT_JAMO_MAP[char]
  if (shiftEntry) return [shiftEntry.shift, shiftEntry.key]
  if (HANGUL_KEY_MAP[char]) return [HANGUL_KEY_MAP[char]]

// Shift가 필요한 자모 집합 (두벌식 기준)
const SHIFT_JAMO = new Set(['ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ', 'ㅒ', 'ㅖ'])

function getFirstKeys(char: string): string[] {
  if (char === ' ') return [' ']
  if (HANGUL_KEY_MAP[char]) {
    const key = HANGUL_KEY_MAP[char]
    return SHIFT_JAMO.has(char) ? ['shift-l', 'shift-r', key] : [key]
  }
 dev

  const code = char.charCodeAt(0)
  if (code >= 0xac00 && code <= 0xd7a3) {
    const firstJamo = disassembleToGroups(char)[0]?.[0]
    if (firstJamo) {
 claude/typing-learning-service-design-2F4a1
      const shiftFirst = SHIFT_JAMO_MAP[firstJamo]
      if (shiftFirst) return [shiftFirst.shift, shiftFirst.key]
      const key = HANGUL_KEY_MAP[firstJamo] ?? char.toLowerCase()
      return [key]

      const key = HANGUL_KEY_MAP[firstJamo] ?? char.toLowerCase()
      return SHIFT_JAMO.has(firstJamo) ? ['shift-l', 'shift-r', key] : [key]
 dev
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
    // 현재 글자의 자모를 모두 입력한 상태 → 키보드 안내 없음 (확정 대기)
    if (composingJamos.length >= targetJamos.length) return []
    const nextJamo = targetJamos[composingJamos.length]
    if (nextJamo) {
 claude/typing-learning-service-design-2F4a1
      const shiftEntry = SHIFT_JAMO_MAP[nextJamo]
      if (shiftEntry) return [shiftEntry.shift, shiftEntry.key]
      const key = HANGUL_KEY_MAP[nextJamo] ?? nextJamo.toLowerCase()
      return [key]

      const key = HANGUL_KEY_MAP[nextJamo] ?? nextJamo.toLowerCase()
      return SHIFT_JAMO.has(nextJamo) ? ['shift-l', 'shift-r', key] : [key]
 dev
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
  // 조합 시작 시점의 확정 입력값 — stale closure 없이 composingChar 범위 계산
  const compositionBaseRef = useRef('')
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
  // useTypingStore.getState()로 최신 userInput을 직접 읽어 stale closure 회피
  const handleCompositionStart = useCallback(() => {
    compositionBaseRef.current = useTypingStore.getState().userInput
    isComposingRef.current = true
    inputHandlers.onCompositionStart()
  }, [inputHandlers])

  // compositionEnd: ref 먼저 false로 설정 → onChange가 handleInput 처리
  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false
    setComposingChar('')
    inputHandlers.onCompositionEnd(e)
  }, [inputHandlers])

  // onChange: compositionBaseRef 기준으로 composingChar 추출 (stale closure 방지)
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (isComposingRef.current) {
      setComposingChar(e.target.value.slice(compositionBaseRef.current.length))
    } else {
      setComposingChar('')
      inputHandlers.onChange(e)
    }
  }, [inputHandlers])

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

 claude/typing-learning-service-design-2F4a1
      <VirtualKeyboard nextKeys={nextKeys} />

      <VirtualKeyboard targetKeys={targetKeys} nextKeys={nextKeys} />
 dev
    </div>
  )
}

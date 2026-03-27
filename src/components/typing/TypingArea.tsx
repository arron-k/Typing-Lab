'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTypingStore } from '@/store/useTypingStore'
import { useTypingEngine } from '@/hooks/useTypingEngine'
import TypingText from './TypingText'
import QuizPopup from './QuizPopup'
import VirtualKeyboard from '@/components/keyboard/VirtualKeyboard'
import type { TypingData } from '@/types'
import { disassemble, assemble } from 'es-hangul'

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
  'ㅃ': 'q', 'ㅉ': 'w', 'ㄸ': 'e', 'ㄲ': 'r', 'ㅆ': 't',
  'ㅒ': 'o', 'ㅖ': 'p',
  ' ': ' ',
}

// 쌍자음/쌍모음 → { 기본키, 눌러야 할 Shift 방향 }
// 왼손 키(q~t) → shift-r / 오른손 키(o, p) → shift-l
const SHIFT_JAMO_MAP: Record<string, { key: string; shift: 'shift-l' | 'shift-r' }> = {
  'ㅃ': { key: 'q', shift: 'shift-r' },
  'ㅉ': { key: 'w', shift: 'shift-r' },
  'ㄸ': { key: 'e', shift: 'shift-r' },
  'ㄲ': { key: 'r', shift: 'shift-r' },
  'ㅆ': { key: 't', shift: 'shift-r' },
  'ㅒ': { key: 'o', shift: 'shift-l' },
  'ㅖ': { key: 'p', shift: 'shift-l' },
}

// disassemble 기반 flat 자모 비교
// - 독립 자모("ㄷ")도 올바르게 처리 (disassembleToGroups per-syllable 방식 대체)
// - 음절 경계를 넘는 경우도 정확히 계산 (바다: 바ㄷ → 다음 자모 ㅏ)
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

  const key = HANGUL_KEY_MAP[nextJamo] ?? nextJamo.toLowerCase()
  return [key]
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
  const compositionBaseRef = useRef('')
  // 백스페이스 입력 시에만 DOM 동기화 허용
  // compositionEnd 후 무분별한 inputRef.value 덮어쓰기를 막아 IME 상태 보호
  const needsDomSyncRef = useRef(false)
  const store = useTypingStore()
  const { inputHandlers, state } = useTypingEngine()
  const [resolvedQuizzes, setResolvedQuizzes] = useState<Record<string, string>>({})
  const [pendingQuizKey, setPendingQuizKey] = useState<string | null>(null)
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

  // 백스페이스 후에만 DOM 동기화 — compositionEnd 후 초기화는 IME 상태를 교란하므로 제거
  useEffect(() => {
    if (needsDomSyncRef.current && inputRef.current) {
      inputRef.current.value = state.userInput
      needsDomSyncRef.current = false
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

  // Backspace: 조합 중이 아닐 때만 DOM 동기화 플래그 설정
  // 조합 중에는 브라우저/IME가 backspace를 처리하므로 DOM 강제 동기화 불필요
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !isComposingRef.current) {
      needsDomSyncRef.current = true
    }
    inputHandlers.onKeyDown(e)
  }, [inputHandlers])

  const handleCompositionStart = useCallback(() => {
    compositionBaseRef.current = useTypingStore.getState().userInput
    isComposingRef.current = true
    inputHandlers.onCompositionStart()
  }, [inputHandlers])

  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false
    setComposingChar('')
    inputHandlers.onCompositionEnd(e)
  }, [inputHandlers])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (isComposingRef.current) {
      // 문자 길이(char length) 기반 slice는 받침 임시 결합 시 오작동
      // 예) compositionBase="바"(len=1), input="박"(len=1) → "박".slice(1) = "" (빈 문자열 버그)
      // 자모 수 기반으로 슬라이싱해야 정확: disassemble("바")=2자모, disassemble("박")=3자모 → slice(2)=["ㄱ"]
      const baseJamoCount = Array.from(disassemble(compositionBaseRef.current)).length
      const inputJamo = Array.from(disassemble(e.target.value))
      const newJamo = inputJamo.slice(baseJamoCount)
      setComposingChar(newJamo.length > 0 ? assemble(newJamo) : '')
    } else {
      setComposingChar('')
      inputHandlers.onChange(e)
    }
  }, [inputHandlers])

  const currentText = store.currentText
  // confirmed + composing 전체를 inputValue로 합산 → disassemble 기반 자모 인덱스 계산
  const inputValue = state.userInput + composingChar
  const nextKeys = getNextKeys(currentText, inputValue)

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
        onKeyDown={handleKeyDown}
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
          isComposing={state.isComposing}
        />
      )}

      <p className="text-xs text-gray-400 text-center cursor-text">
        화면을 클릭하면 타이핑을 시작할 수 있어요
      </p>

      <VirtualKeyboard nextKeys={nextKeys} />
    </div>
  )
}

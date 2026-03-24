'use client'

import { useEffect, useRef, useState } from 'react'
import { useTypingStore } from '@/store/useTypingStore'
import { useTypingEngine } from '@/hooks/useTypingEngine'
import TypingText from './TypingText'
import QuizPopup from './QuizPopup'
import VirtualKeyboard from '@/components/keyboard/VirtualKeyboard'
import type { TypingData } from '@/types'
import { KEYBOARD_ROWS } from '@/components/keyboard/keymap'

interface TypingAreaProps {
  typingData: TypingData
  stageId: number
  stepId: number
  targetKeys: string[]
  onComplete: () => void
}

// 현재 타이핑할 글자로부터 해당 키를 추론
// 한글 완성형 → 두벌식 키 매핑 (주요 글자만 포함)
const HANGUL_KEY_MAP: Record<string, string> = {
  // 모음
  'ㅏ': 'k', 'ㅓ': 'j', 'ㅣ': 'l', 'ㅗ': 'h',
  'ㅕ': 'u', 'ㅛ': 'y', 'ㅑ': 'i', 'ㅐ': 'o', 'ㅔ': 'p',
  'ㅜ': 'n', 'ㅡ': 'm', 'ㅠ': 'b',
  // 초성 자음
  'ㅂ': 'q', 'ㅈ': 'w', 'ㄷ': 'e', 'ㄱ': 'r', 'ㅅ': 't',
  'ㅁ': 'a', 'ㄴ': 's', 'ㅇ': 'd', 'ㄹ': 'f', 'ㅎ': 'g',
  'ㅋ': 'z', 'ㅌ': 'x', 'ㅊ': 'c', 'ㅍ': 'v',
  ' ': ' ',
}

function getNextKeyForChar(char: string): string {
  if (char === ' ') return ' '
  const key = HANGUL_KEY_MAP[char]
  return key ?? char.toLowerCase()
}

// 퀴즈 플레이스홀더 파싱
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
  typingData,
  stageId,
  stepId,
  targetKeys,
  onComplete,
}: TypingAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const store = useTypingStore()
  const { inputHandlers, state } = useTypingEngine()

  const [resolvedQuizzes, setResolvedQuizzes] = useState<Record<string, string>>({})
  const [pendingQuizKey, setPendingQuizKey] = useState<string | null>(null)

  // 퀴즈를 포함한 실제 타이핑 텍스트 계산
  const getResolvedText = () => {
    let text = typingData.text
    for (const [key, answer] of Object.entries(resolvedQuizzes)) {
      text = text.replace(`[${key}]`, answer)
    }
    return text
  }

  // 세션 초기화
  useEffect(() => {
    const text = typingData.type === 'normal'
      ? typingData.text
      : getResolvedText()

    store.initSession(text, stageId, stepId)
    if (inputRef.current) inputRef.current.value = ''
    inputRef.current?.focus()
  }, [typingData.id])

  // 백스페이스/리셋 후 DOM 입력값을 스토어와 동기화 (조합 중이 아닐 때만)
  useEffect(() => {
    if (inputRef.current && !store.isComposing) {
      inputRef.current.value = state.userInput
    }
  }, [state.userInput])

  // 완료 감지
  useEffect(() => {
    if (state.isCompleted) {
      onComplete()
    }
  }, [state.isCompleted])

  // 퀴즈 플레이스홀더 도달 감지
  useEffect(() => {
    if (typingData.type !== 'quiz' || !typingData.quizOptions) return

    const currentText = store.currentText
    const inputLen = state.userInput.length

    // 현재 커서가 [quiz_N] 위치에 도달했는지 체크
    const remaining = currentText.slice(inputLen)
    const nextBracket = remaining.match(/^\[([^\]]+)\]/)
    if (nextBracket) {
      const quizKey = nextBracket[1]
      if (!resolvedQuizzes[quizKey] && pendingQuizKey !== quizKey) {
        setPendingQuizKey(quizKey)
      }
    }
  }, [state.userInput])

  const handleQuizSelect = (placeholderKey: string, answer: string) => {
    const newResolved = { ...resolvedQuizzes, [placeholderKey]: answer }
    setResolvedQuizzes(newResolved)
    setPendingQuizKey(null)

    // 퀴즈 결과 스토어 반영
    store.selectQuizAnswer(placeholderKey, answer)

    // 텍스트 업데이트
    let text = typingData.text
    for (const [key, ans] of Object.entries(newResolved)) {
      text = text.replace(`[${key}]`, ans)
    }
    store.initSession(text, stageId, stepId)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // 다음 눌러야 할 키 계산
  const currentText = store.currentText
  const nextChar = currentText[state.cursorIndex]
  const nextKey = nextChar ? getNextKeyForChar(nextChar) : undefined

  // WPM 실시간 표시 (0이면 숨김)
  const showStats = (store.startTime !== null)

  // 퀴즈 텍스트 렌더링 (플레이스홀더 → 팝업)
  const renderQuizText = () => {
    if (typingData.type !== 'quiz') return null
    const parts = parseTextWithQuiz(typingData.text)

    return (
      <div className="font-mono text-lg leading-relaxed p-4 bg-blue-50 rounded-xl border-2 border-blue-100 mb-3">
        {parts.map((part, i) => {
          if (part.type === 'text') {
            return <span key={i} className="text-gray-700">{part.content}</span>
          }
          const quizKey = part.key!
          const resolved = resolvedQuizzes[quizKey]
          const isPending = pendingQuizKey === quizKey
          const option = typingData.quizOptions?.[quizKey]

          if (resolved) {
            return (
              <span key={i} className="text-green-600 font-bold underline decoration-green-400">
                {resolved}
              </span>
            )
          }
          if (isPending && option) {
            return <QuizPopup key={i} placeholderKey={quizKey} option={option} onSelect={handleQuizSelect} />
          }
          return (
            <span key={i} className="inline-block px-3 py-0.5 bg-yellow-200 text-yellow-800 rounded font-bold text-sm mx-1">
              ?
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 상단 스탯바 */}
      {showStats && (
        <div className="flex gap-6 text-sm font-semibold text-gray-600 px-1">
          <span>⚡ {state.wpm} WPM</span>
          <span>🎯 {state.accuracy}%</span>
          <span>❌ {state.mistakes}회</span>
        </div>
      )}

      {/* 퀴즈 타입: 문제 표시 영역 */}
      {typingData.type === 'quiz' && renderQuizText()}

      {/* 숨김 입력창 — 비제어(uncontrolled): value 제거로 한글 IME 조합 보호 */}
      <input
        ref={inputRef}
        type="text"
        defaultValue=""
        className="fixed opacity-0 top-[-100px] left-[-100px] w-px h-px"
        aria-hidden="true"
        readOnly={pendingQuizKey !== null}
        {...inputHandlers}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      {/* 타이핑 텍스트 — 클릭 시 포커스 */}
      {pendingQuizKey === null && (
        <div onClick={() => inputRef.current?.focus()} className="cursor-text">
          <TypingText
            currentText={store.currentText}
            userInput={state.userInput}
            isShaking={state.isShaking}
          />
        </div>
      )}

      {/* 입력 유도 클릭 영역 */}
      <button
        onClick={() => inputRef.current?.focus()}
        className="text-xs text-gray-400 text-center py-1 cursor-text"
      >
        여기를 클릭하면 타이핑을 시작할 수 있어요
      </button>

      {/* 가상 키보드 */}
      <VirtualKeyboard targetKeys={targetKeys} nextKey={nextKey} />
    </div>
  )
}

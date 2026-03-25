'use client'

import { disassembleToGroups } from 'es-hangul'

interface TypingTextProps {
  currentText: string
  confirmedInput: string
  composingChar: string
  isShaking: boolean
}

export default function TypingText({ currentText, confirmedInput, composingChar, isShaking }: TypingTextProps) {
  const cursorIndex = confirmedInput.length

  return (
    <div
      className={`
        font-mono text-2xl leading-relaxed tracking-wide p-6
        bg-gray-50 rounded-2xl border-2 border-gray-100 min-h-[5rem]
        ${isShaking ? 'animate-[shake_0.3s_ease-in-out]' : ''}
      `}
    >
      {currentText.split('').map((char, index) => {
        let displayChar: string = char === ' ' ? '\u00A0' : char
        let charClass = 'text-gray-300'
        let showCursor = false

        if (index < cursorIndex) {
          charClass = confirmedInput[index] === char
            ? 'text-green-600'
            : 'text-red-500 bg-red-50 rounded'
        } else if (index === cursorIndex) {
          if (composingChar) {
            // IME 임시 받침 상태 감지: composingChar의 자모가 target 자모로 시작하고 더 긺
            // 예) target="어"(ㅇ,ㅓ), composingChar="엉"(ㅇ,ㅓ,ㅇ) → target 표시
            const targetJamos = disassembleToGroups(char)[0] ?? [char]
            const composingJamos = disassembleToGroups(composingChar)[0] ?? [composingChar]
            const isOnTrack = targetJamos.every((j, i) => composingJamos[i] === j)
            const hasBatchimExtension = composingJamos.length > targetJamos.length

            if (isOnTrack && hasBatchimExtension) {
              displayChar = char === ' ' ? '\u00A0' : char
            } else {
              displayChar = composingChar === ' ' ? '\u00A0' : composingChar
            }
            charClass = 'text-blue-500 underline decoration-blue-400'
          } else {
            showCursor = true
            charClass = 'text-gray-300'
          }
        }

        return (
          <span key={index} className="relative">
            {showCursor && (
              <span
                className="absolute -left-0.5 top-0 bottom-0 w-0.5 bg-blue-500 animate-[cursor-blink_1s_step-end_infinite]"
                aria-hidden="true"
              />
            )}
            <span className={charClass}>{displayChar}</span>
          </span>
        )
      })}

      {cursorIndex === currentText.length && currentText.length > 0 && (
        <span className="inline-block w-0.5 h-6 bg-green-500 align-middle ml-0.5" />
      )}
    </div>
  )
}

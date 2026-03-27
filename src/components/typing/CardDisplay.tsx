'use client'

import { disassembleToGroups } from 'es-hangul'

interface CardDisplayProps {
  currentToken: string
  confirmedInput: string
  composingChar: string
  isComposing: boolean
  isShaking: boolean
  upcomingTokens: string[]
  tokenIndex: number
  totalTokens: number
}

export default function CardDisplay({
  currentToken,
  confirmedInput,
  composingChar,
  isComposing,
  isShaking,
  upcomingTokens,
  tokenIndex,
  totalTokens,
}: CardDisplayProps) {
  const cursorIndex = confirmedInput.length
  const label = currentToken.length > 1 ? '입력할 단어' : '입력할 자리'

  return (
    <div className="flex items-center gap-8 min-h-[11rem]">
      {/* 현재 토큰 카드 */}
      <div
        className={`
          relative flex flex-col items-center justify-center
          min-w-[10rem] px-8 h-40 rounded-3xl bg-indigo-500 text-white shadow-lg flex-shrink-0
          ${isShaking ? 'animate-[shake_0.3s_ease-in-out]' : ''}
        `}
      >
        <p className="text-xs font-semibold text-indigo-200 mb-2">{label}</p>

        {/* 글자별 진행 표시 */}
        <div className="font-mono text-4xl font-bold tracking-widest flex gap-0.5">
          {currentToken.split('').map((char, index) => {
            const displayChar = char === ' ' ? '\u00A0' : char
            let charClass = 'text-indigo-200'
            let showCursor = false

            if (index < cursorIndex) {
              charClass = confirmedInput[index] === char
                ? 'text-white'
                : 'text-red-300 line-through'
            } else if (index === cursorIndex) {
              if (isComposing || composingChar) {
                if (composingChar) {
                  const targetJamos = disassembleToGroups(char)[0] ?? [char]
                  const composingJamos = disassembleToGroups(composingChar)[0] ?? [composingChar]
                  const isOnTrack = composingJamos.every((j, i) => j === targetJamos[i])
                  charClass = isOnTrack
                    ? 'text-yellow-300 underline decoration-yellow-300'
                    : 'text-red-300 underline decoration-red-300'
                } else {
                  charClass = 'text-indigo-200 underline decoration-indigo-300'
                }
              } else {
                showCursor = true
                charClass = 'text-indigo-200'
              }
            }

            return (
              <span key={index} className="relative">
                {showCursor && (
                  <span
                    className="absolute -left-0.5 top-0 bottom-0 w-0.5 bg-white animate-[cursor-blink_1s_step-end_infinite]"
                    aria-hidden="true"
                  />
                )}
                <span className={charClass}>{displayChar}</span>
              </span>
            )
          })}
        </div>

        {/* 토큰 카운터 */}
        <p className="text-xs text-indigo-300 mt-3">
          {tokenIndex + 1} / {totalTokens}
        </p>
      </div>

      {/* 대기 토큰 목록 */}
      <div className="flex items-center gap-6 overflow-hidden">
        {upcomingTokens.slice(0, 5).map((token, i) => (
          <span
            key={i}
            className="font-mono text-2xl font-medium text-slate-400"
            style={{ opacity: Math.max(0.15, 0.7 - i * 0.15) }}
          >
            {token}
          </span>
        ))}
      </div>
    </div>
  )
}

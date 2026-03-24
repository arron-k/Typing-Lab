'use client'

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
            displayChar = composingChar === ' ' ? '\u00A0' : composingChar
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

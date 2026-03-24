'use client'

interface TypingTextProps {
  currentText: string
  userInput: string
  isShaking: boolean
}

export default function TypingText({ currentText, userInput, isShaking }: TypingTextProps) {
  return (
    <div
      className={`
        font-mono text-2xl leading-relaxed tracking-wide p-6
        bg-gray-50 rounded-2xl border-2 border-gray-100 min-h-[5rem]
        ${isShaking ? 'animate-[shake_0.3s_ease-in-out]' : ''}
      `}
    >
      {currentText.split('').map((char, index) => {
        const inputChar = userInput[index]

        let charClass = 'text-gray-300'  // 아직 입력 안 됨

        if (index < userInput.length) {
          charClass = inputChar === char
            ? 'text-green-600'  // 올바른 입력
            : 'text-red-500 bg-red-50 rounded'  // 오타
        }

        const isCursor = index === userInput.length

        return (
          <span key={index} className="relative">
            {/* 커서 */}
            {isCursor && (
              <span
                className="absolute -left-0.5 top-0 bottom-0 w-0.5 bg-blue-500 animate-[cursor-blink_1s_step-end_infinite]"
                aria-hidden="true"
              />
            )}
            <span className={charClass}>
              {char === ' ' ? '\u00A0' : char}
            </span>
          </span>
        )
      })}

      {/* 텍스트 끝 커서 */}
      {userInput.length === currentText.length && currentText.length > 0 && (
        <span className="inline-block w-0.5 h-6 bg-green-500 align-middle ml-0.5" />
      )}
    </div>
  )
}

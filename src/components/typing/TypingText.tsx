'use client'

interface TypingTextProps {
  currentText: string
  userInput: string
  isShaking: boolean
  isComposing?: boolean
}

export default function TypingText({ currentText, userInput, isShaking, isComposing = false }: TypingTextProps) {
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
        const isComposingChar = isComposing && index === userInput.length - 1

        let charClass = 'text-gray-300'

        if (index < userInput.length) {
          if (isComposingChar) {
            charClass = 'text-blue-500 underline decoration-blue-400'
          } else {
            charClass = inputChar === char
              ? 'text-green-600'
              : 'text-red-500 bg-red-50 rounded'
          }
        }

        const isCursor = !isComposing && index === userInput.length

        return (
          <span key={index} className="relative">
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

      {userInput.length === currentText.length && currentText.length > 0 && (
        <span className="inline-block w-0.5 h-6 bg-green-500 align-middle ml-0.5" />
      )}
    </div>
  )
}

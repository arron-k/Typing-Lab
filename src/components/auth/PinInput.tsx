'use client'

import { useRef, KeyboardEvent, ClipboardEvent } from 'react'

interface PinInputProps {
  value: string
  onChange: (value: string) => void
}

export default function PinInput({ value, onChange }: PinInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, char: string) => {
    if (!/^\d?$/.test(char)) return

    const digits = value.split('')
    digits[index] = char
    const newValue = digits.join('').slice(0, 4)
    onChange(newValue.padEnd(4, '').trimEnd())

    if (char && index < 3) {
      inputs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        inputs.current[index - 1]?.focus()
        const digits = value.split('')
        digits[index - 1] = ''
        onChange(digits.join('').trimEnd())
      } else {
        const digits = value.split('')
        digits[index] = ''
        onChange(digits.join('').trimEnd())
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < 3) inputs.current[index + 1]?.focus()
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    onChange(pasted)
    const focusIndex = Math.min(pasted.length, 3)
    inputs.current[focusIndex]?.focus()
  }

  return (
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl
                     focus:border-blue-500 focus:outline-none transition-colors
                     bg-white text-gray-800 caret-transparent"
        />
      ))}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import KeyCap from './KeyCap'
import { KEYBOARD_ROWS } from './keymap'

interface VirtualKeyboardProps {
  targetKeys: string[]
  nextKeys?: string[]
}

export default function VirtualKeyboard({ targetKeys, nextKeys }: VirtualKeyboardProps) {
  const [pressedKeys, setPressedKeys] = useState<string[]>([])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key === ' ' ? ' ' : e.key.toLowerCase()
      const keys = [key]
      if (e.shiftKey) keys.push('shift-l', 'shift-r')
      setPressedKeys(keys)
    }
    const handleKeyUp = () => setPressedKeys([])

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return (
    <div
      id="keyboard-container"
      className="relative bg-gray-50 border border-gray-200 rounded-2xl p-3 select-none"
    >
      <div className="space-y-1.5">
        {KEYBOARD_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="flex gap-1">
            {row.map((keyInfo) => (
              <KeyCap
                key={keyInfo.key}
                keyInfo={keyInfo}
                isTarget={nextKeys?.includes(keyInfo.key) ?? false}
                isPressed={pressedKeys.includes(keyInfo.key)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

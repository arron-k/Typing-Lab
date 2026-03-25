'use client'

import { useEffect, useState } from 'react'
import KeyCap from './KeyCap'
import HandOverlay from './HandOverlay'
import { KEYBOARD_ROWS } from './keymap'
import { useSettingsStore } from '@/store/useSettingsStore'
import type { FingerType, KeyInfo } from '@/types'

interface VirtualKeyboardProps {
  targetKeys: string[]
  nextKey?: string
}

function findKeyInfo(key: string): KeyInfo | null {
  for (const row of KEYBOARD_ROWS) {
    const found = row.find((k) => k.key === key)
    if (found) return found
  }
  return null
}

export default function VirtualKeyboard({ targetKeys, nextKey }: VirtualKeyboardProps) {
  const [pressedKey, setPressedKey] = useState<string | null>(null)
  const showHandOverlay = useSettingsStore((s) => s.showHandOverlay)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key === ' ' ? ' ' : e.key.toLowerCase()
      setPressedKey(key)
    }
    const handleKeyUp = () => setPressedKey(null)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const nextKeyInfo = nextKey ? findKeyInfo(nextKey) : null
  const guideFinger: FingerType | null = nextKeyInfo?.finger ?? null

  const pressedKeyInfo = pressedKey ? findKeyInfo(pressedKey) : null
  const pressedFinger: FingerType | null = pressedKeyInfo?.finger ?? null

  // 눌린 키가 가이드 키와 일치하는지 — 정/오타 판단
  const isCorrect: boolean | null =
    pressedKey && nextKey ? pressedKey === nextKey : null

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
                isTarget={keyInfo.key === nextKey}
                isPressed={pressedKey === keyInfo.key}
              />
            ))}
          </div>
        ))}
      </div>

      {showHandOverlay && nextKey && (
        <HandOverlay
          guideKey={nextKey}
          guideFinger={guideFinger}
          pressedKey={pressedKey}
          pressedFinger={pressedFinger}
          isCorrect={isCorrect}
        />
      )}
    </div>
  )
}

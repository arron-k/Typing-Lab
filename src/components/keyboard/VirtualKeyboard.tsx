'use client'

import { useEffect, useState } from 'react'
import KeyCap from './KeyCap'
import HandOverlay from './HandOverlay'
import { KEYBOARD_ROWS } from './keymap'
import type { FingerType, KeyInfo } from '@/types'

interface VirtualKeyboardProps {
  targetKeys: string[]   // 현재 스텝에서 강조할 키 목록
  nextKey?: string       // 당장 눌러야 할 키 (강렬한 빨강)
}

export default function VirtualKeyboard({ targetKeys, nextKey }: VirtualKeyboardProps) {
  const [pressedKey, setPressedKey] = useState<string | null>(null)

  // 실제 키 입력 감지 → 눌림 시각 피드백
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setPressedKey(e.key.toLowerCase())
    }
    const handleKeyUp = () => {
      setPressedKey(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // nextKey에 해당하는 손가락 정보 찾기
  const findKeyInfo = (key: string): KeyInfo | null => {
    for (const row of KEYBOARD_ROWS) {
      const found = row.find((k) => k.key === key)
      if (found) return found
    }
    return null
  }

  const nextKeyInfo = nextKey ? findKeyInfo(nextKey) : null
  const targetFinger: FingerType | null = nextKeyInfo?.finger ?? null

  return (
    <div
      id="keyboard-container"
      className="relative bg-gray-50 border border-gray-200 rounded-2xl p-3 select-none"
    >
      <div className="space-y-1.5">
        {KEYBOARD_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="flex gap-1">
            {row.map((keyInfo) => {
              const isTarget = keyInfo.key === nextKey
              const isPressed = pressedKey === keyInfo.key
              return (
                <KeyCap
                  key={keyInfo.key}
                  keyInfo={keyInfo}
                  isTarget={isTarget}
                  isPressed={isPressed}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* 손가락 실루엣 오버레이 */}
      {nextKey && (
        <HandOverlay
          targetKey={nextKey}
          targetFinger={targetFinger}
        />
      )}
    </div>
  )
}

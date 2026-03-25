'use client'

import { useEffect, useState } from 'react'
import KeyCap from './KeyCap'
import { KEYBOARD_ROWS } from './keymap'

// e.code → keymap key 변환 테이블
// 한영 상태와 무관하게 물리적 키 위치를 기준으로 감지
const CODE_TO_KEY: Record<string, string> = {
  Backquote: '`',
  Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4', Digit5: '5',
  Digit6: '6', Digit7: '7', Digit8: '8', Digit9: '9', Digit0: '0',
  Minus: '-', Equal: '=', Backspace: 'backspace',
  Tab: 'tab',
  KeyQ: 'q', KeyW: 'w', KeyE: 'e', KeyR: 'r', KeyT: 't',
  KeyY: 'y', KeyU: 'u', KeyI: 'i', KeyO: 'o', KeyP: 'p',
  BracketLeft: '[', BracketRight: ']', Backslash: '\\',
  CapsLock: 'capslock',
  KeyA: 'a', KeyS: 's', KeyD: 'd', KeyF: 'f', KeyG: 'g',
  KeyH: 'h', KeyJ: 'j', KeyK: 'k', KeyL: 'l',
  Semicolon: ';', Quote: "'", Enter: 'enter',
  ShiftLeft: 'shift-l',
  KeyZ: 'z', KeyX: 'x', KeyC: 'c', KeyV: 'v', KeyB: 'b',
  KeyN: 'n', KeyM: 'm',
  Comma: ',', Period: '.', Slash: '/',
  ShiftRight: 'shift-r',
  ControlLeft: 'ctrl-l', MetaLeft: 'win', AltLeft: 'alt-l',
  Space: ' ',
  AltRight: 'alt-r', ControlRight: 'ctrl-r',
}

interface VirtualKeyboardProps {
  nextKeys?: string[]
}

export default function VirtualKeyboard({ nextKeys }: VirtualKeyboardProps) {
  const [pressedKeys, setPressedKeys] = useState<string[]>([])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = CODE_TO_KEY[e.code]
      if (!key) return
      setPressedKeys(prev => prev.includes(key) ? prev : [...prev, key])
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = CODE_TO_KEY[e.code]
      if (!key) return
      // 해당 키만 제거 — Shift 홀드 중 다른 키 릴리즈 시 Shift 점등 유지
      setPressedKeys(prev => prev.filter(k => k !== key))
    }

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

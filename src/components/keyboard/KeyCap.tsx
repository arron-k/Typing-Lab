'use client'

import { forwardRef } from 'react'
import type { KeyInfo } from '@/types'

interface KeyCapProps {
  keyInfo: KeyInfo
  isTarget: boolean
  isPressed?: boolean
}

const KeyCap = forwardRef<HTMLDivElement, KeyCapProps>(
  ({ keyInfo, isTarget, isPressed = false }, ref) => {
    const { key, label, shiftLabel, width = 1 } = keyInfo

    const isSpecial = ['backspace', 'tab', 'capslock', 'enter', 'shift-l', 'shift-r',
      'ctrl-l', 'ctrl-r', 'win', 'alt-l', 'alt-r', 'hanja', 'haneng'].includes(key)

    // 색상 우선순위: 타겟 > 눌림 > 특수키 > 기본
    const colorClass = isTarget
      ? 'bg-[#B71C1C] text-white border-[#7F0000] shadow-[0_2px_0_#7F0000] ring-2 ring-red-400 ring-offset-1'
      : isPressed
      ? 'bg-blue-200 text-blue-800 border-blue-300 shadow-none translate-y-0.5'
      : isSpecial
      ? 'bg-gray-100 text-gray-500 border-gray-300'
      : 'bg-white text-gray-700 border-gray-200'

    return (
      <div
        ref={ref}
        data-key={key}
        style={{ flexGrow: width, flexBasis: `${width * 2.75}rem`, minWidth: `${width * 2.75}rem` }}
        className={`
          relative flex flex-col items-center justify-center
          h-11 rounded-lg border-2 text-xs font-semibold
          select-none cursor-default transition-all duration-75
          shadow-[0_2px_0_rgba(0,0,0,0.15)]
          ${colorClass}
        `}
      >
        {shiftLabel && (
          <span className="absolute top-0.5 left-1 text-[9px] opacity-60 leading-none">
            {shiftLabel}
          </span>
        )}
        <span className={`leading-none ${key === ' ' ? '' : ''}`}>{label}</span>
      </div>
    )
  }
)

KeyCap.displayName = 'KeyCap'
export default KeyCap

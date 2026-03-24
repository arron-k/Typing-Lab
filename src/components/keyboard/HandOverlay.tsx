'use client'

import { useEffect, useState } from 'react'
import type { FingerType } from '@/types'

interface HandOverlayProps {
  targetKey: string
  targetFinger: FingerType | null
}

// 손가락 인덱스 매핑 (SVG path 식별용)
const FINGER_INDEX: Record<string, number> = {
  'left-pinky':   0,
  'left-ring':    1,
  'left-middle':  2,
  'left-index':   3,
  'left-thumb':   4,
  'right-thumb':  5,
  'right-index':  6,
  'right-middle': 7,
  'right-ring':   8,
  'right-pinky':  9,
}

export default function HandOverlay({ targetKey, targetFinger }: HandOverlayProps) {
  const [keyRect, setKeyRect] = useState<{ x: number; y: number } | null>(null)
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (!targetKey) return

    const updatePosition = () => {
      const keyEl = document.querySelector(`[data-key="${targetKey}"]`)
      const containerEl = document.getElementById('keyboard-container')
      if (!keyEl || !containerEl) return

      const kRect = keyEl.getBoundingClientRect()
      const cRect = containerEl.getBoundingClientRect()

      setKeyRect({
        x: kRect.left - cRect.left + kRect.width / 2,
        y: kRect.top - cRect.top + kRect.height / 2,
      })
      setContainerRect(cRect)
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [targetKey])

  if (!targetFinger || !keyRect) return null

  const isLeftHand = targetFinger.startsWith('left-')
  const fingerIdx = FINGER_INDEX[targetFinger] ?? 3

  // 왼손/오른손 중 해당 손의 손가락 팁 기본 오프셋 (SVG 기준)
  // 실제 프로젝트에서는 SVG 내 각 손가락 좌표를 정밀 측정해야 함
  const fingerTipOffsets: Record<FingerType, { dx: number; dy: number }> = {
    'left-pinky':   { dx: -60, dy: 20 },
    'left-ring':    { dx: -35, dy: 5  },
    'left-middle':  { dx: -15, dy: 0  },
    'left-index':   { dx: 5,   dy: 5  },
    'left-thumb':   { dx: 25,  dy: 30 },
    'right-thumb':  { dx: -25, dy: 30 },
    'right-index':  { dx: -5,  dy: 5  },
    'right-middle': { dx: 15,  dy: 0  },
    'right-ring':   { dx: 35,  dy: 5  },
    'right-pinky':  { dx: 60,  dy: 20 },
  }

  const offset = fingerTipOffsets[targetFinger]
  const handX = keyRect.x - offset.dx - 40
  const handY = keyRect.y - offset.dy - 60

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
      aria-hidden="true"
    >
      {/* 손 모양 SVG — 실루엣 */}
      <svg
        viewBox="0 0 100 120"
        width="80"
        height="96"
        style={{
          position: 'absolute',
          left: handX,
          top: handY,
          transform: isLeftHand ? 'scaleX(-1)' : 'scaleX(1)',
          transition: 'left 0.15s ease, top 0.15s ease',
          opacity: 0.4,
        }}
      >
        {/* 손바닥 */}
        <ellipse cx="50" cy="90" rx="32" ry="25" fill="rgba(50,50,50,0.9)" />
        {/* 손가락 5개 — 새끼(0), 약지(1), 중지(2), 검지(3), 엄지(4) */}
        {/* 새끼손가락 */}
        <rect
          x="10" y="45" width="14" height="42" rx="7"
          fill={fingerIdx === 0 ? 'rgba(183,28,28,0.95)' : 'rgba(50,50,50,0.9)'}
          style={{ transition: 'fill 0.1s' }}
        />
        {/* 약지 */}
        <rect
          x="27" y="32" width="14" height="52" rx="7"
          fill={fingerIdx === 1 ? 'rgba(183,28,28,0.95)' : 'rgba(50,50,50,0.9)'}
          style={{ transition: 'fill 0.1s' }}
        />
        {/* 중지 */}
        <rect
          x="44" y="25" width="14" height="58" rx="7"
          fill={fingerIdx === 2 ? 'rgba(183,28,28,0.95)' : 'rgba(50,50,50,0.9)'}
          style={{ transition: 'fill 0.1s' }}
        />
        {/* 검지 */}
        <rect
          x="61" y="30" width="14" height="53" rx="7"
          fill={fingerIdx === 3 ? 'rgba(183,28,28,0.95)' : 'rgba(50,50,50,0.9)'}
          style={{ transition: 'fill 0.1s' }}
        />
        {/* 엄지 — 오른쪽으로 튀어나옴 */}
        <ellipse
          cx="88" cy="75" rx="10" ry="18"
          fill={fingerIdx === 4 ? 'rgba(183,28,28,0.95)' : 'rgba(50,50,50,0.9)'}
          style={{ transition: 'fill 0.1s' }}
        />
      </svg>
    </div>
  )
}

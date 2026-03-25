'use client'

import { useEffect, useRef, useState } from 'react'
import type { FingerType } from '@/types'

interface HandOverlayProps {
  guideKey: string
  guideFinger: FingerType | null
  pressedKey: string | null
  pressedFinger: FingerType | null
  isCorrect: boolean | null
}

// 손가락 SVG 인덱스 (새끼=0, 약지=1, 중지=2, 검지=3, 엄지=4)
const FINGER_INDEX: Record<FingerType, number> = {
  'left-pinky':   0,
  'left-ring':    1,
  'left-middle':  2,
  'left-index':   3,
  'left-thumb':   4,
  'right-thumb':  4,
  'right-index':  3,
  'right-middle': 2,
  'right-ring':   1,
  'right-pinky':  0,
}

const FINGER_TIP_OFFSETS: Record<FingerType, { dx: number; dy: number }> = {
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

type OverlayMode = 'guide' | 'feedback'

export default function HandOverlay({
  guideKey,
  guideFinger,
  pressedKey,
  pressedFinger,
  isCorrect,
}: HandOverlayProps) {
  const [mode, setMode] = useState<OverlayMode>('guide')
  const [capturedPressedKey, setCapturedPressedKey] = useState<string | null>(null)
  const [capturedPressedFinger, setCapturedPressedFinger] = useState<FingerType | null>(null)
  const [capturedIsCorrect, setCapturedIsCorrect] = useState<boolean | null>(null)
  const [keyPos, setKeyPos] = useState<{ x: number; y: number } | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // pressedKey 변경 시 → feedback 모드로 전환, 200ms 후 guide 복귀
  useEffect(() => {
    if (!pressedKey) return
    if (timerRef.current) clearTimeout(timerRef.current)
    setCapturedPressedKey(pressedKey)
    setCapturedPressedFinger(pressedFinger)
    setCapturedIsCorrect(isCorrect)
    setMode('feedback')
    timerRef.current = setTimeout(() => setMode('guide'), 200)
  }, [pressedKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  // 현재 표시할 키/손가락 — 모드에 따라 결정
  const displayKey = mode === 'feedback' && capturedPressedKey ? capturedPressedKey : guideKey
  const displayFinger = mode === 'feedback' && capturedPressedFinger ? capturedPressedFinger : guideFinger

  // 표시 키 위치 계산
  useEffect(() => {
    if (!displayKey) return
    const update = () => {
      const keyEl = document.querySelector(`[data-key="${displayKey}"]`)
      const containerEl = document.getElementById('keyboard-container')
      if (!keyEl || !containerEl) return
      const kRect = keyEl.getBoundingClientRect()
      const cRect = containerEl.getBoundingClientRect()
      setKeyPos({
        x: kRect.left - cRect.left + kRect.width / 2,
        y: kRect.top - cRect.top + kRect.height / 2,
      })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [displayKey])

  if (!displayFinger || !keyPos) return null

  const isLeftHand = displayFinger.startsWith('left-')
  const fingerIdx = FINGER_INDEX[displayFinger]
  const offset = FINGER_TIP_OFFSETS[displayFinger]

  const handX = keyPos.x - offset.dx - 40
  const handY = keyPos.y - offset.dy - 60

  // 모드별 시각 스타일
  const isFeedback = mode === 'feedback'
  const handOpacity = isFeedback ? 0.9 : 0.4
  const pressTranslateY = isFeedback ? 4 : 0

  const activeFingerColor = (() => {
    if (!isFeedback) return 'rgba(120,120,120,0.85)'
    if (capturedIsCorrect === true)  return 'rgba(46,125,50,0.95)'   // 녹색
    if (capturedIsCorrect === false) return 'rgba(183,28,28,0.95)'   // 빨간색
    return 'rgba(21,101,192,0.95)'                                    // 중립 파란색
  })()

  const baseColor = isFeedback ? 'rgba(60,60,60,0.9)' : 'rgba(100,100,100,0.6)'

  const fingerColor = (idx: number) =>
    idx === fingerIdx ? activeFingerColor : baseColor

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 120"
        width="80"
        height="96"
        style={{
          position: 'absolute',
          left: handX,
          top: handY,
          transform: `scaleX(${isLeftHand ? -1 : 1}) translateY(${pressTranslateY}px)`,
          transition: 'left 0.15s ease, top 0.15s ease, opacity 0.1s, transform 0.08s ease',
          opacity: handOpacity,
        }}
      >
        {/* 손바닥 */}
        <ellipse cx="50" cy="90" rx="32" ry="25" fill={baseColor} />
        {/* 새끼손가락 */}
        <rect x="10" y="45" width="14" height="42" rx="7" fill={fingerColor(0)} />
        {/* 약지 */}
        <rect x="27" y="32" width="14" height="52" rx="7" fill={fingerColor(1)} />
        {/* 중지 */}
        <rect x="44" y="25" width="14" height="58" rx="7" fill={fingerColor(2)} />
        {/* 검지 */}
        <rect x="61" y="30" width="14" height="53" rx="7" fill={fingerColor(3)} />
        {/* 엄지 */}
        <ellipse cx="88" cy="75" rx="10" ry="18" fill={fingerColor(4)} />
      </svg>
    </div>
  )
}

'use client'

interface LeoAvatarProps {
  level: number
  size?: 'sm' | 'md' | 'lg'
  mood?: 'normal' | 'happy' | 'excited'
}

// 레벨별 복장 (Phase 1: 이모지, Phase 2: 3D 에셋으로 교체)
function getOutfit(level: number): { emoji: string; label: string; bg: string } {
  if (level >= 10) return { emoji: '🚀', label: '우주복', bg: 'from-indigo-400 to-purple-500' }
  if (level >= 5)  return { emoji: '🔬', label: '연구 가운', bg: 'from-blue-400 to-cyan-500' }
  return { emoji: '🔧', label: '작업복', bg: 'from-orange-400 to-yellow-500' }
}

const SIZE_MAP = { sm: 'w-12 h-12 text-2xl', md: 'w-20 h-20 text-4xl', lg: 'w-32 h-32 text-6xl' }

export default function LeoAvatar({ level, size = 'md', mood = 'normal' }: LeoAvatarProps) {
  const outfit = getOutfit(level)
  const sizeClass = SIZE_MAP[size]

  const catEmoji = mood === 'excited' ? '😺' : mood === 'happy' ? '😸' : '🐱'

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${sizeClass} rounded-full bg-gradient-to-br ${outfit.bg} flex items-center justify-center shadow-lg`}
      >
        <span role="img" aria-label="레오">
          {catEmoji}
        </span>
      </div>
      <span className="text-xs text-gray-500 font-medium">{outfit.label}</span>
    </div>
  )
}

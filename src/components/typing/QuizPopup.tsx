'use client'

import { useState } from 'react'
import type { QuizOption } from '@/types'

interface QuizPopupProps {
  placeholderKey: string
  option: QuizOption
  onSelect: (placeholderKey: string, answer: string) => void
}

export default function QuizPopup({ placeholderKey, option, onSelect }: QuizPopupProps) {
  const [selected, setSelected] = useState<string | null>(null)

  const handleSelect = (choice: string) => {
    setSelected(choice)
    const isCorrect = choice === option.answer

    // 정답 시 즉시 진행, 오답 시 0.5s 후 재선택 가능
    if (isCorrect) {
      setTimeout(() => onSelect(placeholderKey, choice), 300)
    } else {
      setTimeout(() => setSelected(null), 500)
    }
  }

  return (
    <div className="inline-flex flex-col items-center gap-1 mx-1">
      <div className="flex gap-2">
        {option.choices.map((choice) => {
          const isSelected = selected === choice
          const isWrong = isSelected && choice !== option.answer
          const isRight = isSelected && choice === option.answer

          return (
            <button
              key={choice}
              onClick={() => handleSelect(choice)}
              disabled={selected !== null}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-bold border-2 transition-all cursor-pointer
                ${isRight  ? 'bg-green-500 text-white border-green-600 scale-105' : ''}
                ${isWrong  ? 'bg-red-500 text-white border-red-600 animate-[shake_0.3s_ease-in-out]' : ''}
                ${!isSelected ? 'bg-yellow-50 text-yellow-800 border-yellow-400 hover:bg-yellow-100' : ''}
              `}
            >
              {choice}
            </button>
          )
        })}
      </div>
      <span className="text-xs text-gray-400">올바른 표현을 골라봐!</span>
    </div>
  )
}

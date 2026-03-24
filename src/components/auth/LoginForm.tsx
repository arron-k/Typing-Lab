'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PinInput from './PinInput'
import { useAuth } from '@/hooks/useAuth'

type Mode = 'login' | 'register'

export default function LoginForm() {
  const router = useRouter()
  const { signIn, register } = useAuth()

  const [mode, setMode] = useState<Mode>('login')
  const [nickname, setNickname] = useState('')
  const [pin, setPin] = useState('')
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!nickname.trim() || pin.length < 4) return
    setIsLoading(true)
    setMessage(null)

    const result = mode === 'login'
      ? await signIn(nickname, pin)
      : await register(nickname, pin)

    setIsLoading(false)

    if (result.success) {
      setMessage({ text: result.message, type: 'success' })
      setTimeout(() => router.push('/dashboard'), 800)
    } else {
      setMessage({ text: result.message, type: 'error' })
    }
  }

  const canSubmit = nickname.trim().length >= 2 && pin.length === 4 && !isLoading

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm">
        {/* 레오 캐릭터 영역 */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-2">🐱</div>
          <h1 className="text-xl font-bold text-gray-800">
            {mode === 'login' ? '안녕! 나는 레오야' : '처음 만나서 반가워!'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'login' ? '오늘도 함께 타이핑 연습하자!' : '이름이랑 비밀번호를 만들어 봐'}
          </p>
        </div>

        {/* 입력 폼 */}
        <div className="space-y-5">
          {/* 닉네임 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              내 이름 (닉네임)
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleSubmit()}
              placeholder="예) 우주탐험가"
              maxLength={10}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800
                         focus:border-blue-400 focus:outline-none transition-colors text-base"
            />
          </div>

          {/* PIN */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              비밀번호 (숫자 4자리)
            </label>
            <PinInput value={pin} onChange={setPin} />
          </div>

          {/* 메시지 */}
          {message && (
            <p
              className={`text-sm text-center font-medium rounded-lg py-2 px-3 ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              {message.text}
            </p>
          )}

          {/* 제출 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200
                       text-white disabled:text-gray-400 font-bold text-base rounded-xl
                       transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? '잠깐만...' : mode === 'login' ? '시작하기 →' : '가입하기 →'}
          </button>
        </div>

        {/* 모드 전환 */}
        <div className="text-center mt-5">
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage(null) }}
            className="text-sm text-blue-500 hover:text-blue-700 underline cursor-pointer"
          >
            {mode === 'login' ? '처음이야? 회원가입하기' : '이미 있어? 로그인하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

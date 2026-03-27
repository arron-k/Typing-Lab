// ─────────────────────────────────────────────
// PRD 명세 인터페이스
// ─────────────────────────────────────────────

export interface User {
  uid: string
  nickname: string
  pin: string // 4자리
  level: number
  exp: number
  lastLogin: string // ISO date string
  streakDays: number
}

export interface Progress {
  uid: string
  stageId: number
  stepId: number
  highestStars: number // 0~3
  highestWpm: number
  isUnlocked: boolean
}

export type QuizOption = {
  choices: [string, string]
  answer: string
}

export interface TypingData {
  id: string
  type: 'normal' | 'quiz'
  displayMode?: 'linear' | 'card'
  text: string
  quizOptions?: Record<string, QuizOption> // key: 'quiz_1', 'quiz_2', ...
  theme: 'science' | 'grammar' | 'general'
}

// ─────────────────────────────────────────────
// 커리큘럼 구조 타입
// ─────────────────────────────────────────────

export interface StarConditions {
  one: {
    accuracy?: number
    wpm?: number
    mistakeMax?: number
    mustComplete?: boolean
  }
  two: {
    accuracy?: number
    wpm?: number
  }
  three: {
    accuracy?: number
    wpm?: number
    mistakeCount?: 0
    quizScore?: number // 100 = 퀴즈 전부 정답
  }
}

export interface StepData {
  id: number
  stageId: number
  order: number
  title: string
  targetKeys: string[] // 이 스텝에서 강조할 키 (키보드 하이라이트)
  typingData: TypingData[]
}

export interface StageData {
  id: number
  title: string
  description: string
  starConditions: StarConditions
  steps: StepData[]
}

// ─────────────────────────────────────────────
// 세션 결과 타입
// ─────────────────────────────────────────────

export interface SessionResult {
  stageId: number
  stepId: number
  wpm: number
  accuracy: number     // 0~100
  mistakeCount: number
  quizScore: number    // 0~100, 퀴즈 없으면 100
  stars: number        // 0~3
  expGained: number
  durationMs: number
}

// ─────────────────────────────────────────────
// 퀴즈 상태 타입
// ─────────────────────────────────────────────

export interface QuizState {
  placeholderKey: string      // 'quiz_1'
  selectedAnswer: string | null
  isCorrect: boolean | null
}

// ─────────────────────────────────────────────
// 키보드 관련 타입
// ─────────────────────────────────────────────

export type FingerType =
  | 'left-pinky'
  | 'left-ring'
  | 'left-middle'
  | 'left-index'
  | 'left-thumb'
  | 'right-thumb'
  | 'right-index'
  | 'right-middle'
  | 'right-ring'
  | 'right-pinky'

export interface KeyInfo {
  key: string          // DOM 이벤트 key 값 (소문자)
  label: string        // 화면 표시 레이블 (한글 또는 영문)
  shiftLabel?: string  // Shift 시 표시 레이블
  width?: number       // 상대적 너비 배수 (기본 1)
  finger: FingerType
}

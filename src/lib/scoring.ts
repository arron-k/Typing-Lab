import type { SessionResult, StarConditions } from '@/types'

// 스테이지별 클리어 보너스 EXP
const STAGE_CLEAR_BONUS: Record<number, number> = {
  1: 50,
  2: 100,
  3: 150,
  4: 200,
}

// 스테이지별 별점 조건 (PRD 6.1항)
const STAR_CONDITIONS: Record<number, StarConditions> = {
  1: {
    one:   { accuracy: 80 },
    two:   { accuracy: 90 },
    three: { mistakeCount: 0 },
  },
  2: {
    one:   { accuracy: 80, mustComplete: true },
    two:   { accuracy: 90 },
    three: { accuracy: 95, wpm: 100 },
  },
  3: {
    one:   { wpm: 70, mistakeMax: 5 },
    two:   { wpm: 100, accuracy: 90 },
    three: { wpm: 150, quizScore: 100 },
  },
  4: {
    one:   { mustComplete: true },
    two:   { wpm: 120, accuracy: 90 },
    three: { wpm: 180, quizScore: 100 },
  },
}

/**
 * WPM 계산 (한국어 기준: 분당 글자 수 CPM을 WPM으로 환산)
 * 한국어는 평균 단어 길이를 2.5 글자로 가정
 */
export function calcWPM(charCount: number, durationMs: number): number {
  if (durationMs <= 0) return 0
  const minutes = durationMs / 1000 / 60
  const cpm = charCount / minutes
  return Math.round(cpm / 2.5) // CPM → WPM
}

/**
 * 정확도 계산
 * @param totalChars 총 입력한 글자 수
 * @param mistakes   오타 횟수
 */
export function calcAccuracy(totalChars: number, mistakes: number): number {
  if (totalChars === 0) return 100
  const correct = Math.max(0, totalChars - mistakes)
  return Math.round((correct / totalChars) * 100)
}

/**
 * 별점 계산 — stageId별 분기 (PRD 6.1항)
 */
export function calcStars(
  stageId: number,
  result: Omit<SessionResult, 'stars' | 'expGained'>
): number {
  const conditions = STAR_CONDITIONS[stageId]
  if (!conditions) return 0

  // ⭐⭐⭐ 퍼펙트 조건 체크
  const three = conditions.three
  const isThree = checkCondition(three, result)

  // ⭐⭐ 조건 체크
  const two = conditions.two
  const isTwo = checkCondition(two, result)

  // ⭐ 해금 조건 체크
  const one = conditions.one
  const isOne = checkCondition(one, result)

  if (isThree) return 3
  if (isTwo) return 2
  if (isOne) return 1
  return 0
}

function checkCondition(
  condition: StarConditions['one'] | StarConditions['two'] | StarConditions['three'],
  result: Omit<SessionResult, 'stars' | 'expGained'>
): boolean {
  if (!condition) return false

  if (condition.accuracy !== undefined && result.accuracy < condition.accuracy) return false
  if (condition.wpm !== undefined && result.wpm < condition.wpm) return false
  if ('mistakeMax' in condition && condition.mistakeMax !== undefined && result.mistakeCount > condition.mistakeMax) return false
  if ('mistakeCount' in condition && condition.mistakeCount === 0 && result.mistakeCount > 0) return false
  if ('quizScore' in condition && condition.quizScore !== undefined && result.quizScore < condition.quizScore) return false
  if ('mustComplete' in condition && condition.mustComplete && result.wpm === 0) return false

  return true
}

/**
 * EXP 계산 (PRD 6.2항)
 * 공식: (타수 × 1) × 정확도배수(95%↑ → 1.5x) + 스테이지 클리어 보너스
 */
export function calcExp(
  charCount: number,
  accuracy: number,
  stageId: number,
  stars: number
): number {
  const accuracyMultiplier = accuracy >= 95 ? 1.5 : 1.0
  const base = charCount * accuracyMultiplier
  const bonus = stars >= 1 ? (STAGE_CLEAR_BONUS[stageId] ?? 0) : 0
  return Math.round(base + bonus)
}

/**
 * 일일 출석 보너스 체크 (PRD 6.2항)
 * @param lastLogin 마지막 로그인 ISO 날짜 문자열
 * @param streakDays 현재 연속 출석일
 */
export function checkDailyBonus(
  lastLogin: string,
  streakDays: number
): { bonus: number; newStreak: number; isFirstToday: boolean } {
  const today = new Date().toISOString().split('T')[0]
  const lastDate = lastLogin.split('T')[0]

  if (today === lastDate) {
    return { bonus: 0, newStreak: streakDays, isFirstToday: false }
  }

  const diff = Math.floor(
    (new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
  )

  const newStreak = diff === 1 ? streakDays + 1 : 0

  return { bonus: 300, newStreak, isFirstToday: true }
}

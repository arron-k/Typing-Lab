import { calcWPM, calcAccuracy, calcStars, calcExp, checkDailyBonus } from './scoring'
import type { SessionResult } from '@/types'

const baseResult = (overrides: Partial<Omit<SessionResult, 'stars' | 'expGained'>>): Omit<SessionResult, 'stars' | 'expGained'> => ({
  stageId: 1,
  stepId: 101,
  wpm: 0,
  accuracy: 100,
  mistakeCount: 0,
  quizScore: 100,
  durationMs: 60000,
  ...overrides,
})

describe('calcWPM', () => {
  test('0ms이면 0 반환', () => {
    expect(calcWPM(100, 0)).toBe(0)
  })

  test('60초 동안 250글자 → WPM 100', () => {
    expect(calcWPM(250, 60000)).toBe(100)
  })

  test('30초 동안 125글자 → WPM 100', () => {
    expect(calcWPM(125, 30000)).toBe(100)
  })
})

describe('calcAccuracy', () => {
  test('총 글자 0이면 100 반환', () => {
    expect(calcAccuracy(0, 0)).toBe(100)
  })

  test('오타 없으면 100%', () => {
    expect(calcAccuracy(100, 0)).toBe(100)
  })

  test('10글자 중 1개 오타 → 90%', () => {
    expect(calcAccuracy(10, 1)).toBe(90)
  })

  test('오타가 총 글자 수 이상이면 0%', () => {
    expect(calcAccuracy(5, 10)).toBe(0)
  })
})

describe('calcStars — Stage 1 (정확도 기반)', () => {
  test('정확도 79% + 오타 있음 → 별 0개', () => {
    expect(calcStars(1, baseResult({ accuracy: 79, mistakeCount: 3 }))).toBe(0)
  })

  test('정확도 80% + 오타 있음 → 별 1개', () => {
    expect(calcStars(1, baseResult({ accuracy: 80, mistakeCount: 2 }))).toBe(1)
  })

  test('정확도 90% + 오타 있음 → 별 2개', () => {
    expect(calcStars(1, baseResult({ accuracy: 90, mistakeCount: 1 }))).toBe(2)
  })

  test('정확도 100% + 오타 0 → 별 3개', () => {
    expect(calcStars(1, baseResult({ accuracy: 100, mistakeCount: 0 }))).toBe(3)
  })

  test('오타 1개 → 별 3개 불가, 별 2개', () => {
    expect(calcStars(1, baseResult({ accuracy: 95, mistakeCount: 1 }))).toBe(2)
  })
})

describe('calcStars — Stage 2 (정확도 + WPM)', () => {
  test('정확도 79% → 별 0개', () => {
    expect(calcStars(2, baseResult({ stageId: 2, accuracy: 79, wpm: 50 }))).toBe(0)
  })

  test('정확도 80% + wpm > 0 → 별 1개', () => {
    expect(calcStars(2, baseResult({ stageId: 2, accuracy: 80, wpm: 50 }))).toBe(1)
  })

  test('정확도 95% + WPM 100 → 별 3개', () => {
    expect(calcStars(2, baseResult({ stageId: 2, accuracy: 95, wpm: 100 }))).toBe(3)
  })

  test('정확도 95% + WPM 99 → 별 2개', () => {
    expect(calcStars(2, baseResult({ stageId: 2, accuracy: 95, wpm: 99 }))).toBe(2)
  })
})

describe('calcStars — Stage 3 (WPM + 퀴즈)', () => {
  test('WPM 69 → 별 0개', () => {
    expect(calcStars(3, baseResult({ stageId: 3, wpm: 69, mistakeCount: 3, quizScore: 100 }))).toBe(0)
  })

  test('WPM 70 + 오타 5이하 → 별 1개', () => {
    expect(calcStars(3, baseResult({ stageId: 3, wpm: 70, mistakeCount: 5, quizScore: 50 }))).toBe(1)
  })

  test('WPM 150 + 퀴즈 100% → 별 3개', () => {
    expect(calcStars(3, baseResult({ stageId: 3, wpm: 150, accuracy: 95, quizScore: 100 }))).toBe(3)
  })
})

describe('calcExp', () => {
  test('정확도 95% 미만 — 기본 배율', () => {
    // 100글자 × 1.0 + 클리어보너스 없음(별 0개) = 100
    expect(calcExp(100, 94, 1, 0)).toBe(100)
  })

  test('정확도 95% 이상 — 1.5배 배율', () => {
    // 100글자 × 1.5 = 150
    expect(calcExp(100, 95, 1, 0)).toBe(150)
  })

  test('별 1개 이상 — Stage 1 클리어 보너스 +50', () => {
    // 100글자 × 1.0 + 50 = 150
    expect(calcExp(100, 80, 1, 1)).toBe(150)
  })

  test('Stage 4 클리어 보너스 +200', () => {
    // 100글자 × 1.5 + 200 = 350
    expect(calcExp(100, 95, 4, 1)).toBe(350)
  })
})

describe('checkDailyBonus', () => {
  test('오늘 이미 로그인했으면 보너스 없음', () => {
    const today = new Date().toISOString()
    const result = checkDailyBonus(today, 5)
    expect(result.bonus).toBe(0)
    expect(result.isFirstToday).toBe(false)
    expect(result.newStreak).toBe(5)
  })

  test('어제 로그인했으면 streak +1, 보너스 300', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString()
    const result = checkDailyBonus(yesterday, 3)
    expect(result.bonus).toBe(300)
    expect(result.isFirstToday).toBe(true)
    expect(result.newStreak).toBe(4)
  })

  test('2일 이상 지나면 streak 초기화', () => {
    const twoDaysAgo = new Date(Date.now() - 86400000 * 2).toISOString()
    const result = checkDailyBonus(twoDaysAgo, 10)
    expect(result.bonus).toBe(300)
    expect(result.newStreak).toBe(0)
  })
})

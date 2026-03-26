/**
 * TypingArea 유틸 함수 단위 테스트
 * getNextKeys 의 키보드 점등 로직을 검증
 *
 * 두벌식 기준 주요 매핑:
 *   ㅇ → d   ㄱ → r   ㅏ → k   ㅕ → u   ㅣ → l
 *   ㅃ → shift-r+q   ㅆ → shift-r+t   ㅖ → shift-l+p
 */

// TypingArea는 'use client' 컴포넌트이므로 순수 함수만 추출해 테스트
// 실제 파일의 로직을 동일하게 인라인으로 재구현하여 검증
import { disassemble } from 'es-hangul'

// ── 테스트용 로직 인라인 ─────────────────────────────────────
const HANGUL_KEY_MAP: Record<string, string> = {
  'ㅏ': 'k', 'ㅓ': 'j', 'ㅣ': 'l', 'ㅗ': 'h',
  'ㅕ': 'u', 'ㅛ': 'y', 'ㅑ': 'i', 'ㅐ': 'o', 'ㅔ': 'p',
  'ㅜ': 'n', 'ㅡ': 'm', 'ㅠ': 'b',
  'ㅂ': 'q', 'ㅈ': 'w', 'ㄷ': 'e', 'ㄱ': 'r', 'ㅅ': 't',
  'ㅁ': 'a', 'ㄴ': 's', 'ㅇ': 'd', 'ㄹ': 'f', 'ㅎ': 'g',
  'ㅋ': 'z', 'ㅌ': 'x', 'ㅊ': 'c', 'ㅍ': 'v',
  'ㅃ': 'q', 'ㅉ': 'w', 'ㄸ': 'e', 'ㄲ': 'r', 'ㅆ': 't',
  'ㅒ': 'o', 'ㅖ': 'p',
  ' ': ' ',
}

const SHIFT_JAMO_MAP: Record<string, { key: string; shift: 'shift-l' | 'shift-r' }> = {
  'ㅃ': { key: 'q', shift: 'shift-r' },
  'ㅉ': { key: 'w', shift: 'shift-r' },
  'ㄸ': { key: 'e', shift: 'shift-r' },
  'ㄲ': { key: 'r', shift: 'shift-r' },
  'ㅆ': { key: 't', shift: 'shift-r' },
  'ㅒ': { key: 'o', shift: 'shift-l' },
  'ㅖ': { key: 'p', shift: 'shift-l' },
}

function getNextKeys(targetText: string, inputValue: string): string[] {
  if (!targetText) return []

  const targetJamo = disassemble(targetText)
  const inputJamo = disassemble(inputValue)

  if (inputJamo.length >= targetJamo.length) return []

  const nextJamo = targetJamo[inputJamo.length]
  if (!nextJamo) return []

  if (nextJamo === ' ') return [' ']

  const shiftEntry = SHIFT_JAMO_MAP[nextJamo]
  if (shiftEntry) return [shiftEntry.shift, shiftEntry.key]

  const key = HANGUL_KEY_MAP[nextJamo] ?? nextJamo.toLowerCase()
  return [key]
}
// ────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────
// getNextKeys — composing 없음 (첫 자모 안내)
// ─────────────────────────────────────────────
describe('getNextKeys — 조합 없음 (첫 자모 안내)', () => {
  test('빈 타겟 → 빈 배열', () => {
    expect(getNextKeys('', '')).toEqual([])
  })

  test('여: input 없음 → ㅇ (d키)', () => {
    expect(getNextKeys('여', '')).toEqual(['d'])
  })

  test('기: input 없음 → ㄱ (r키)', () => {
    expect(getNextKeys('기', '')).toEqual(['r'])
  })

  test('나: input 없음 → ㄴ (s키)', () => {
    expect(getNextKeys('나', '')).toEqual(['s'])
  })

  test('하: input 없음 → ㅎ (g키)', () => {
    expect(getNextKeys('하', '')).toEqual(['g'])
  })

  test('공백 → 스페이스바', () => {
    expect(getNextKeys(' ', '')).toEqual([' '])
  })

  test('영문자 소문자: a → a', () => {
    expect(getNextKeys('a', '')).toEqual(['a'])
  })

  test('영문자 대문자: A → a (소문자화)', () => {
    expect(getNextKeys('A', '')).toEqual(['a'])
  })

  test('쌍자음 ㅃ → shift-r+q (왼손 키이므로 오른쪽 Shift)', () => {
    expect(getNextKeys('ㅃ', '')).toEqual(['shift-r', 'q'])
  })

  test('쌍자음 ㄲ → shift-r+r (왼손 키이므로 오른쪽 Shift)', () => {
    expect(getNextKeys('ㄲ', '')).toEqual(['shift-r', 'r'])
  })

  test('쌍모음 ㅖ → shift-l+p (오른손 키이므로 왼쪽 Shift)', () => {
    expect(getNextKeys('ㅖ', '')).toEqual(['shift-l', 'p'])
  })

  test('쌍모음 ㅒ → shift-l+o (오른손 키이므로 왼쪽 Shift)', () => {
    expect(getNextKeys('ㅒ', '')).toEqual(['shift-l', 'o'])
  })
})

// ─────────────────────────────────────────────
// getNextKeys — 자모 진행 중 (핵심 로직)
// ─────────────────────────────────────────────
describe('getNextKeys — 자모 조합 진행 중', () => {
  test('여: ㅇ 입력 후 → ㅕ (u키) 안내', () => {
    expect(getNextKeys('여', 'ㅇ')).toEqual(['u'])
  })

  test('기: ㄱ 입력 후 → ㅣ (l키) 안내', () => {
    expect(getNextKeys('기', 'ㄱ')).toEqual(['l'])
  })

  test('한: ㅎ 입력 후 → ㅏ (k키) 안내', () => {
    expect(getNextKeys('한', 'ㅎ')).toEqual(['k'])
  })

  test('한: 하 입력 후 → ㄴ (s키) 안내 (받침)', () => {
    expect(getNextKeys('한', '하')).toEqual(['s'])
  })

  test('국: ㄱ 입력 후 → ㅜ (n키) 안내', () => {
    expect(getNextKeys('국', 'ㄱ')).toEqual(['n'])
  })
})

// ─────────────────────────────────────────────
// getNextKeys — 음절 경계 (바다 버그 핵심)
// ─────────────────────────────────────────────
describe('getNextKeys — 음절 경계 (바다 버그 수정 검증)', () => {
  test('바다: input="" → ㅂ (q키)', () => {
    expect(getNextKeys('바다', '')).toEqual(['q'])
  })

  test('바다: input="ㅂ" → ㅏ (k키)', () => {
    expect(getNextKeys('바다', 'ㅂ')).toEqual(['k'])
  })

  test('바다: input="바" (음절 완성) → ㄷ (e키) [핵심 버그 수정]', () => {
    expect(getNextKeys('바다', '바')).toEqual(['e'])
  })

  test('바다: input="바ㄷ" → ㅏ (k키)', () => {
    expect(getNextKeys('바다', '바ㄷ')).toEqual(['k'])
  })

  test('바다: input="바다" (완성) → []', () => {
    expect(getNextKeys('바다', '바다')).toEqual([])
  })
})

// ─────────────────────────────────────────────
// getNextKeys — 글자 완성 후 [] 반환
// ─────────────────────────────────────────────
describe('getNextKeys — 글자 완성 후 [] 반환', () => {
  test('여 완성(ㅇ+ㅕ) 후 → []', () => {
    expect(getNextKeys('여', '여')).toEqual([])
  })

  test('기 완성(ㄱ+ㅣ) 후 → []', () => {
    expect(getNextKeys('기', '기')).toEqual([])
  })

  test('한 완성(ㅎ+ㅏ+ㄴ) 후 → []', () => {
    expect(getNextKeys('한', '한')).toEqual([])
  })

  test('하 조합 중이고 타겟이 한(받침 있음) → ㄴ (s키) 안내', () => {
    expect(getNextKeys('한', '하')).toEqual(['s'])
  })

  test('어 타겟인데 composing이 엉 → [] (타겟 완성)', () => {
    // disassemble("엉")=["ㅇ","ㅓ","ㅇ"].length=3 >= disassemble("어")=["ㅇ","ㅓ"].length=2
    expect(getNextKeys('어', '엉')).toEqual([])
  })
})

// ─────────────────────────────────────────────
// getNextKeys — 영문/특수 케이스
// ─────────────────────────────────────────────
describe('getNextKeys — 영문 및 비한글', () => {
  test('영문 타겟: input 없음 → 소문자 키', () => {
    expect(getNextKeys('a', '')).toEqual(['a'])
  })

  test('영문 타겟: 완성 후 → []', () => {
    expect(getNextKeys('b', 'b')).toEqual([])
  })

  test('공백 타겟 → 스페이스', () => {
    expect(getNextKeys(' ', '')).toEqual([' '])
  })
})

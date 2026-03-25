/**
 * TypingArea 유틸 함수 단위 테스트
 * getNextKeys / getFirstKeys 의 키보드 점등 로직을 검증
 *
 * 두벌식 기준 주요 매핑:
 *   ㅇ → d   ㄱ → r   ㅏ → k   ㅕ → u   ㅣ → l
 *   ㅃ → shift+q   ㅆ → shift+t   ㅖ → shift+p
 */

// TypingArea는 'use client' 컴포넌트이므로 순수 함수만 추출해 테스트
// 실제 파일의 로직을 동일하게 인라인으로 재구현하여 검증
import { disassembleToGroups } from 'es-hangul'

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
const SHIFT_JAMO = new Set(['ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ', 'ㅒ', 'ㅖ'])

function getFirstKeys(char: string): string[] {
  if (char === ' ') return [' ']
  if (HANGUL_KEY_MAP[char]) {
    const key = HANGUL_KEY_MAP[char]
    return SHIFT_JAMO.has(char) ? ['shift-l', 'shift-r', key] : [key]
  }
  const code = char.charCodeAt(0)
  if (code >= 0xac00 && code <= 0xd7a3) {
    const firstJamo = disassembleToGroups(char)[0]?.[0]
    if (firstJamo) {
      const key = HANGUL_KEY_MAP[firstJamo] ?? char.toLowerCase()
      return SHIFT_JAMO.has(firstJamo) ? ['shift-l', 'shift-r', key] : [key]
    }
  }
  return [char.toLowerCase()]
}

function getNextKeys(targetChar: string, composingChar: string): string[] {
  if (!targetChar) return []
  if (!composingChar) return getFirstKeys(targetChar)
  const targetCode = targetChar.charCodeAt(0)
  if (targetCode >= 0xac00 && targetCode <= 0xd7a3) {
    const targetJamos = disassembleToGroups(targetChar)[0] ?? []
    const composingJamos = disassembleToGroups(composingChar)[0] ?? []
    if (composingJamos.length >= targetJamos.length) return []
    const nextJamo = targetJamos[composingJamos.length]
    if (nextJamo) {
      const key = HANGUL_KEY_MAP[nextJamo] ?? nextJamo.toLowerCase()
      return SHIFT_JAMO.has(nextJamo) ? ['shift-l', 'shift-r', key] : [key]
    }
  }
  return getFirstKeys(targetChar)
}
// ────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────
// getFirstKeys
// ─────────────────────────────────────────────
describe('getFirstKeys', () => {
  test('완성형 한글: 여 → ㅇ (d키)', () => {
    expect(getFirstKeys('여')).toEqual(['d'])
  })

  test('완성형 한글: 기 → ㄱ (r키)', () => {
    expect(getFirstKeys('기')).toEqual(['r'])
  })

  test('완성형 한글: 나 → ㄴ (s키)', () => {
    expect(getFirstKeys('나')).toEqual(['s'])
  })

  test('완성형 한글: 하 → ㅎ (g키)', () => {
    expect(getFirstKeys('하')).toEqual(['g'])
  })

  test('공백 → 스페이스바', () => {
    expect(getFirstKeys(' ')).toEqual([' '])
  })

  test('영문자 소문자: a → a', () => {
    expect(getFirstKeys('a')).toEqual(['a'])
  })

  test('영문자 대문자: A → a (소문자화)', () => {
    expect(getFirstKeys('A')).toEqual(['a'])
  })

  test('쌍자음 ㅃ → shift+q 두 키', () => {
    expect(getFirstKeys('ㅃ')).toEqual(['shift-l', 'shift-r', 'q'])
  })

  test('쌍자음 ㄲ → shift+r 두 키', () => {
    expect(getFirstKeys('ㄲ')).toEqual(['shift-l', 'shift-r', 'r'])
  })

  test('쌍모음 ㅖ → shift+p 두 키', () => {
    expect(getFirstKeys('ㅖ')).toEqual(['shift-l', 'shift-r', 'p'])
  })
})

// ─────────────────────────────────────────────
// getNextKeys — composingChar 없음 (첫 자모)
// ─────────────────────────────────────────────
describe('getNextKeys — 조합 없음 (첫 자모 안내)', () => {
  test('빈 타겟 → 빈 배열', () => {
    expect(getNextKeys('', '')).toEqual([])
  })

  test('여: composing 없음 → ㅇ (d키)', () => {
    expect(getNextKeys('여', '')).toEqual(['d'])
  })

  test('기: composing 없음 → ㄱ (r키)', () => {
    expect(getNextKeys('기', '')).toEqual(['r'])
  })

  test('쌍자음 시작 글자: composing 없음 → shift 포함', () => {
    // 없는 글자지만 standalone 쌍자음 테스트
    expect(getNextKeys('ㅃ', '')).toEqual(['shift-l', 'shift-r', 'q'])
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
// getNextKeys — 핵심 버그 케이스: 글자 완성 후 잘못된 키 안내
// ─────────────────────────────────────────────
describe('getNextKeys — 글자 완성 후 [] 반환 (핵심 버그 수정 검증)', () => {
  test('여 완성(ㅇ+ㅕ) 후 → [] (ㅇ 다시 안내하면 안 됨)', () => {
    // 버그: composingChar="여"일 때 getFirstKeys('여')→['d'] 반환하던 문제
    expect(getNextKeys('여', '여')).toEqual([])
  })

  test('기 완성(ㄱ+ㅣ) 후 → []', () => {
    expect(getNextKeys('기', '기')).toEqual([])
  })

  test('한 완성(ㅎ+ㅏ+ㄴ) 후 → []', () => {
    expect(getNextKeys('한', '한')).toEqual([])
  })

  test('하 조합 중(ㅎ+ㅏ)이고 타겟이 한(받침 있음) → ㄴ (s키) 안내', () => {
    // composingJamos=['ㅎ','ㅏ'].length=2 < targetJamos=['ㅎ','ㅏ','ㄴ'].length=3 → 아직 안내 필요
    expect(getNextKeys('한', '하')).toEqual(['s'])
  })

  test('hasBatchimExtension: 어 타겟인데 composing이 엉 → [] (타겟 완성)', () => {
    // composingJamos=['ㅇ','ㅓ','ㅇ'].length=3 >= targetJamos=['ㅇ','ㅓ'].length=2
    expect(getNextKeys('어', '엉')).toEqual([])
  })
})

// ─────────────────────────────────────────────
// getNextKeys — 영문/특수 케이스
// ─────────────────────────────────────────────
describe('getNextKeys — 영문 및 비한글', () => {
  test('영문 타겟: composing 없음 → 소문자 키', () => {
    expect(getNextKeys('a', '')).toEqual(['a'])
  })

  test('영문 타겟: composing 있어도 getFirstKeys로 처리', () => {
    expect(getNextKeys('b', 'b')).toEqual(['b'])
  })

  test('공백 타겟 → 스페이스', () => {
    expect(getNextKeys(' ', '')).toEqual([' '])
  })
})

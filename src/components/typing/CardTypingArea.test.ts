/**
 * CardTypingArea 유틸 로직 단위 테스트
 * getNextKeys 및 token 분리 로직 검증
 */
import { disassemble } from 'es-hangul'

// getNextKeys 로직을 직접 인라인으로 테스트 (컴포넌트 내부 함수)
const HANGUL_KEY_MAP: Record<string, string> = {
  'ㅏ': 'k', 'ㅓ': 'j', 'ㅣ': 'l', 'ㅗ': 'h',
  'ㅕ': 'u', 'ㅛ': 'y', 'ㅑ': 'i', 'ㅐ': 'o', 'ㅔ': 'p',
  'ㅜ': 'n', 'ㅡ': 'm', 'ㅠ': 'b',
  'ㅂ': 'q', 'ㅈ': 'w', 'ㄷ': 'e', 'ㄱ': 'r', 'ㅅ': 't',
  'ㅁ': 'a', 'ㄴ': 's', 'ㅇ': 'd', 'ㄹ': 'f', 'ㅎ': 'g',
  'ㅋ': 'z', 'ㅌ': 'x', 'ㅊ': 'c', 'ㅍ': 'v',
}

const SHIFT_JAMO_MAP: Record<string, { key: string; shift: 'shift-l' | 'shift-r' }> = {
  'ㅃ': { key: 'q', shift: 'shift-r' },
  'ㄲ': { key: 'r', shift: 'shift-r' },
  'ㅆ': { key: 't', shift: 'shift-r' },
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
  return [HANGUL_KEY_MAP[nextJamo] ?? nextJamo.toLowerCase()]
}

// token 분리 유틸
function splitTokens(text: string): string[] {
  return text.split(' ').filter(Boolean)
}

// ─────────────────────────────────────────────
// token 분리
// ─────────────────────────────────────────────
describe('splitTokens', () => {
  test('공백으로 분리된 단어 배열을 반환한다', () => {
    expect(splitTokens('나라 이마 하마')).toEqual(['나라', '이마', '하마'])
  })

  test('앞뒤 공백을 무시한다', () => {
    expect(splitTokens(' 나라 이마 ')).toEqual(['나라', '이마'])
  })

  test('빈 문자열은 빈 배열을 반환한다', () => {
    expect(splitTokens('')).toEqual([])
  })
})

// ─────────────────────────────────────────────
// getNextKeys (card 모드: 단일 토큰 기준)
// ─────────────────────────────────────────────
describe('getNextKeys in card mode', () => {
  test('단일 토큰 첫 자모를 반환한다', () => {
    expect(getNextKeys('나라', '')).toEqual(['s']) // ㄴ → s
  })

  test('토큰 완료 시 빈 배열을 반환한다', () => {
    expect(getNextKeys('나', '나')).toEqual([])
  })

  test('단어 중간 자모를 올바르게 반환한다', () => {
    // '나라' 입력 중 '나' 완료 후 → ㄹ → f
    expect(getNextKeys('나라', '나')).toEqual(['f'])
  })

  test('빈 토큰은 빈 배열을 반환한다', () => {
    expect(getNextKeys('', '')).toEqual([])
  })
})

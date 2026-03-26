/**
 * 한글 오토마타 유틸
 * es-hangul 라이브러리를 활용하여 백스페이스 분해 로직 구현
 *
 * 동작 예시:
 *   "봐" → Backspace → "보"  (ㅘ에서 ㅏ 제거)
 *   "보" → Backspace → "ㅂ"  (중성 ㅗ 제거)
 *   "ㅂ" → Backspace → ""    (초성 ㅂ 제거)
 */

import { disassembleToGroups, assemble } from 'es-hangul'

/**
 * 마지막 자모 하나를 제거한 문자열 반환
 * 마지막 음절만 disassembleToGroups로 분해해 자모 하나를 제거 후 재조합
 * 앞 글자들의 음절 경계는 그대로 유지 ("나라" → "나ㄹ", "봐" → "보")
 */
export function deleteLastJamo(text: string): string {
  if (text.length === 0) return ''

  const prefix = text.slice(0, -1)
  const lastChar = text[text.length - 1]

  const groups = disassembleToGroups(lastChar)
  if (groups.length === 0) return prefix

  const lastGroup = groups[groups.length - 1]
  if (lastGroup.length <= 1) return prefix

  return prefix + assemble(lastGroup.slice(0, -1))
}

/**
 * 문자가 한글 완성형 또는 자모인지 확인
 */
export function isHangul(char: string): boolean {
  const code = char.charCodeAt(0)
  // 한글 완성형: 0xAC00 ~ 0xD7A3
  // 한글 자모:   0x3131 ~ 0x318E
  return (code >= 0xac00 && code <= 0xd7a3) || (code >= 0x3131 && code <= 0x318e)
}

/**
 * 문자열의 전체 자모 수 반환 (타수 계산용)
 * "가나다" → 자모 수: ㄱ+ㅏ+ㄴ+ㅏ+ㄷ+ㅏ = 6
 */
export function countJamo(text: string): number {
  let count = 0
  for (const char of text) {
    if (isHangul(char)) {
      const groups = disassembleToGroups(char)
      count += groups.reduce((sum, g) => sum + g.length, 0)
    } else {
      count += 1
    }
  }
  return count
}

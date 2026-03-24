import { deleteLastJamo, isHangul, countJamo } from './hangul'

describe('deleteLastJamo', () => {
  test('빈 문자열은 빈 문자열 반환', () => {
    expect(deleteLastJamo('')).toBe('')
  })

  test('영문자 한 글자 제거', () => {
    expect(deleteLastJamo('a')).toBe('')
  })

  test('복합 모음 분해: 봐 → 보', () => {
    expect(deleteLastJamo('봐')).toBe('보')
  })

  test('중성 제거: 보 → ㅂ', () => {
    expect(deleteLastJamo('보')).toBe('ㅂ')
  })

  test('초성 제거: ㅂ → 빈 문자열', () => {
    expect(deleteLastJamo('ㅂ')).toBe('')
  })

  test('겹받침 분해: 닭 → 달 (ㄺ에서 ㄱ 제거)', () => {
    expect(deleteLastJamo('닭')).toBe('달')
  })

  test('앞 글자는 유지: 나라 → 나ㄹ', () => {
    expect(deleteLastJamo('나라')).toBe('나ㄹ')
  })

  test('숫자는 그대로 제거', () => {
    expect(deleteLastJamo('123')).toBe('12')
  })
})

describe('isHangul', () => {
  test('완성형 한글 인식', () => {
    expect(isHangul('가')).toBe(true)
    expect(isHangul('힣')).toBe(true)
  })

  test('한글 자모 인식', () => {
    expect(isHangul('ㄱ')).toBe(true)
    expect(isHangul('ㅏ')).toBe(true)
  })

  test('영문자는 false', () => {
    expect(isHangul('a')).toBe(false)
  })

  test('숫자는 false', () => {
    expect(isHangul('1')).toBe(false)
  })

  test('공백은 false', () => {
    expect(isHangul(' ')).toBe(false)
  })
})

describe('countJamo', () => {
  test('빈 문자열은 0', () => {
    expect(countJamo('')).toBe(0)
  })

  test('영문자는 글자 수 그대로', () => {
    expect(countJamo('abc')).toBe(3)
  })

  test('한글 자모 수 계산: 가 = ㄱ+ㅏ = 2', () => {
    expect(countJamo('가')).toBe(2)
  })

  test('받침 포함: 강 = ㄱ+ㅏ+ㅇ = 3', () => {
    expect(countJamo('강')).toBe(3)
  })

  test('공백 포함 문장', () => {
    // "나라" = ㄴ+ㅏ+ㄹ+ㅏ = 4, 공백 = 1 → 총 5
    expect(countJamo('나라 ')).toBe(5)
  })
})

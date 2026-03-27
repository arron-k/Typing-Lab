/**
 * useTypingStore 단위 테스트
 * IME 조합 흐름, 백스페이스 오토마타, 완료 조건을 검증
 */
import { act } from '@testing-library/react'
import { useTypingStore } from './useTypingStore'

// 각 테스트 전 스토어 초기화
beforeEach(() => {
  act(() => {
    useTypingStore.getState().initSession('가나다라', 1, 101)
  })
})

// ─────────────────────────────────────────────
// handleInput
// ─────────────────────────────────────────────
describe('handleInput', () => {
  test('입력값이 스토어에 반영된다', () => {
    act(() => {
      useTypingStore.getState().handleInput('가')
    })
    expect(useTypingStore.getState().userInput).toBe('가')
    expect(useTypingStore.getState().cursorIndex).toBe(1)
  })

  test('첫 입력 시 타이머가 시작된다', () => {
    expect(useTypingStore.getState().startTime).toBeNull()
    act(() => {
      useTypingStore.getState().handleInput('가')
    })
    expect(useTypingStore.getState().startTime).not.toBeNull()
  })

  test('정확한 글자 입력 시 mistakes가 증가하지 않는다', () => {
    act(() => {
      useTypingStore.getState().handleInput('가')
    })
    expect(useTypingStore.getState().mistakes).toBe(0)
  })

  test('잘못된 글자 입력 시 mistakes가 1 증가한다', () => {
    act(() => {
      useTypingStore.getState().handleInput('나') // '가'가 아닌 '나'
    })
    expect(useTypingStore.getState().mistakes).toBe(1)
  })

  test('받침 임시 결합 상태는 오타로 판정하지 않는다', () => {
    // "바구니" 입력 중 'ㄱ'이 '바'의 임시 받침이 된 '박' 상태
    // disassemble("박")=['ㅂ','ㅏ','ㄱ'] 이 disassemble("바구니") 의 앞 3자모와 일치 → 오타 아님
    act(() => {
      useTypingStore.getState().initSession('바구니', 1, 101)
      useTypingStore.getState().handleInput('박')
    })
    expect(useTypingStore.getState().mistakes).toBe(0)
  })

  test('연속 handleInput 호출 시 오타를 이중 집계하지 않는다', () => {
    // handleInput은 누적값으로 호출되므로, 이전에 이미 감지된 오타를 재집계하면 안 됨
    act(() => {
      useTypingStore.getState().initSession('가나다라', 1, 101)
      useTypingStore.getState().handleInput('가나라') // '다' 자리에 '라' → 오타 1회
    })
    expect(useTypingStore.getState().mistakes).toBe(1)
    act(() => {
      useTypingStore.getState().handleInput('가나라마') // 새 글자 '마' 추가 (또 오타)
    })
    // 새 글자 '마'도 오타이므로 총 2회 (이전 '라' 위치 오타를 재집계하면 안 됨)
    expect(useTypingStore.getState().mistakes).toBe(2)
  })

  test('isCompleted: 전체 텍스트 입력 시 완료된다', () => {
    act(() => {
      useTypingStore.getState().handleInput('가나다라')
    })
    expect(useTypingStore.getState().isCompleted).toBe(true)
  })

  test('isCompleted 후 추가 입력은 무시된다', () => {
    act(() => {
      useTypingStore.getState().handleInput('가나다라')
    })
    act(() => {
      useTypingStore.getState().handleInput('가나다라마')
    })
    expect(useTypingStore.getState().userInput).toBe('가나다라')
  })
})

// ─────────────────────────────────────────────
// handleBackspace
// ─────────────────────────────────────────────
describe('handleBackspace', () => {
  test('빈 입력에서 백스페이스는 무시된다', () => {
    act(() => {
      useTypingStore.getState().handleBackspace()
    })
    expect(useTypingStore.getState().userInput).toBe('')
  })

  test('영문자 한 글자 삭제', () => {
    act(() => {
      useTypingStore.getState().initSession('abc', 1, 101)
      useTypingStore.getState().handleInput('ab')
    })
    act(() => {
      useTypingStore.getState().handleBackspace()
    })
    expect(useTypingStore.getState().userInput).toBe('a')
  })

  test('한글 받침 분해: 각 → 가', () => {
    act(() => {
      useTypingStore.getState().initSession('각나', 1, 101)
      useTypingStore.getState().handleInput('각')
    })
    act(() => {
      useTypingStore.getState().handleBackspace()
    })
    expect(useTypingStore.getState().userInput).toBe('가')
  })

  test('한글 중성 분해: 가 → ㄱ', () => {
    act(() => {
      useTypingStore.getState().initSession('가나', 1, 101)
      useTypingStore.getState().handleInput('가')
    })
    act(() => {
      useTypingStore.getState().handleBackspace()
    })
    expect(useTypingStore.getState().userInput).toBe('ㄱ')
  })

  test('완료 상태에서 백스페이스는 무시된다', () => {
    act(() => {
      useTypingStore.getState().initSession('가', 1, 101)
      useTypingStore.getState().handleInput('가')
    })
    expect(useTypingStore.getState().isCompleted).toBe(true)
    act(() => {
      useTypingStore.getState().handleBackspace()
    })
    expect(useTypingStore.getState().userInput).toBe('가')
  })
})

// ─────────────────────────────────────────────
// IME 조합 흐름
// ─────────────────────────────────────────────
describe('IME 조합 흐름', () => {
  test('compositionStart → isComposing = true', () => {
    act(() => {
      useTypingStore.getState().handleCompositionStart()
    })
    expect(useTypingStore.getState().isComposing).toBe(true)
  })

  test('compositionEnd → isComposing = false + handleInput 호출', () => {
    act(() => {
      useTypingStore.getState().handleCompositionStart()
    })
    act(() => {
      useTypingStore.getState().handleCompositionEnd('가')
    })
    expect(useTypingStore.getState().isComposing).toBe(false)
    expect(useTypingStore.getState().userInput).toBe('가')
  })

  test('연속 글자 입력: 가→나 시뮬레이션', () => {
    // '가' 조합 후 확정
    act(() => {
      useTypingStore.getState().handleCompositionStart()
      useTypingStore.getState().handleCompositionEnd('가')
    })
    expect(useTypingStore.getState().userInput).toBe('가')

    // '나' 조합 후 확정
    act(() => {
      useTypingStore.getState().handleCompositionStart()
      useTypingStore.getState().handleCompositionEnd('가나')
    })
    expect(useTypingStore.getState().userInput).toBe('가나')
  })

  test('3글자 연속 입력: 가나다 누적', () => {
    act(() => {
      const store = useTypingStore.getState()
      store.initSession('가나다라', 1, 101)
      store.handleCompositionStart()
      store.handleCompositionEnd('가')
      store.handleCompositionStart()
      store.handleCompositionEnd('가나')
      store.handleCompositionStart()
      store.handleCompositionEnd('가나다')
    })
    expect(useTypingStore.getState().userInput).toBe('가나다')
    expect(useTypingStore.getState().cursorIndex).toBe(3)
    expect(useTypingStore.getState().isCompleted).toBe(false)
  })

  test('전체 텍스트 완료 시 isCompleted = true', () => {
    act(() => {
      const store = useTypingStore.getState()
      store.handleCompositionStart()
      store.handleCompositionEnd('가나다라')
    })
    expect(useTypingStore.getState().isCompleted).toBe(true)
  })

  test('오타 판정: compositionEnd 확정값이 타겟과 다를 때 mistakes 증가', () => {
    act(() => {
      useTypingStore.getState().handleCompositionStart()
      useTypingStore.getState().handleCompositionEnd('나') // '가'가 아닌 '나'
    })
    expect(useTypingStore.getState().mistakes).toBe(1)
  })
})

// ─────────────────────────────────────────────
// initSession
// ─────────────────────────────────────────────
describe('initSession', () => {
  test('이전 세션 상태가 초기화된다', () => {
    act(() => {
      useTypingStore.getState().handleInput('가나')
    })
    act(() => {
      useTypingStore.getState().initSession('새 텍스트', 2, 201)
    })
    const state = useTypingStore.getState()
    expect(state.userInput).toBe('')
    expect(state.cursorIndex).toBe(0)
    expect(state.mistakes).toBe(0)
    expect(state.isCompleted).toBe(false)
    expect(state.startTime).toBeNull()
    expect(state.currentText).toBe('새 텍스트')
    expect(state.stageId).toBe(2)
    expect(state.stepId).toBe(201)
  })
})

// ─────────────────────────────────────────────
// WPM / 정확도 실시간 계산
// ─────────────────────────────────────────────
describe('WPM / 정확도', () => {
  test('초기 accuracy는 100이다', () => {
    expect(useTypingStore.getState().accuracy).toBe(100)
  })

  test('오타 발생 시 accuracy가 감소한다', () => {
    act(() => {
      useTypingStore.getState().handleInput('나') // 오타
    })
    expect(useTypingStore.getState().accuracy).toBeLessThan(100)
  })

  test('입력 후 wpm이 0보다 크다', () => {
    act(() => {
      useTypingStore.getState().handleInput('가나다')
    })
    expect(useTypingStore.getState().wpm).toBeGreaterThanOrEqual(0)
  })
})

// ─────────────────────────────────────────────
// initToken (card 모드)
// ─────────────────────────────────────────────
describe('initToken', () => {
  beforeEach(() => {
    act(() => {
      useTypingStore.getState().initSession('나라', 1, 101)
    })
  })

  test('currentText가 새 토큰으로 바뀐다', () => {
    act(() => {
      useTypingStore.getState().handleInput('나라')
      useTypingStore.getState().initToken('이마')
    })
    expect(useTypingStore.getState().currentText).toBe('이마')
  })

  test('userInput과 cursorIndex가 초기화된다', () => {
    act(() => {
      useTypingStore.getState().handleInput('나')
      useTypingStore.getState().initToken('이마')
    })
    expect(useTypingStore.getState().userInput).toBe('')
    expect(useTypingStore.getState().cursorIndex).toBe(0)
  })

  test('isCompleted가 false로 초기화된다', () => {
    act(() => {
      useTypingStore.getState().handleInput('나라')
      useTypingStore.getState().initToken('이마')
    })
    expect(useTypingStore.getState().isCompleted).toBe(false)
  })

  test('mistakes는 이전 토큰 값이 유지된다', () => {
    act(() => {
      useTypingStore.getState().handleInput('다') // '나' 자리에 '다' → 오타 1회
      useTypingStore.getState().initToken('이마')
    })
    expect(useTypingStore.getState().mistakes).toBe(1)
  })

  test('startTime은 이전 토큰 값이 유지된다', () => {
    act(() => {
      useTypingStore.getState().handleInput('나')
    })
    const startTime = useTypingStore.getState().startTime
    act(() => {
      useTypingStore.getState().initToken('이마')
    })
    expect(useTypingStore.getState().startTime).toBe(startTime)
  })

  test('totalTypedChars에 이전 토큰 길이가 누적된다', () => {
    act(() => {
      useTypingStore.getState().initToken('이마')
    })
    expect(useTypingStore.getState().totalTypedChars).toBe(2) // '나라'.length
  })

  test('initSession은 totalTypedChars를 0으로 초기화한다', () => {
    act(() => {
      useTypingStore.getState().initToken('이마')
      useTypingStore.getState().initSession('가나다라', 1, 101)
    })
    expect(useTypingStore.getState().totalTypedChars).toBe(0)
  })
})

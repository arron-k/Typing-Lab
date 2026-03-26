/**
 * useTypingEngine 단위 테스트
 * IME 이벤트 핸들러의 올바른 분기 및 이중 호출 방지를 검증
 */
import { renderHook, act } from '@testing-library/react'
import { useTypingEngine } from './useTypingEngine'
import { useTypingStore } from '@/store/useTypingStore'

beforeEach(() => {
  act(() => {
    useTypingStore.getState().initSession('가나다라', 1, 101)
  })
})

// ─────────────────────────────────────────────
// compositionStart / End
// ─────────────────────────────────────────────
describe('composition 이벤트', () => {
  test('onCompositionStart → 스토어 isComposing = true', () => {
    const { result } = renderHook(() => useTypingEngine())

    act(() => {
      result.current.inputHandlers.onCompositionStart()
    })

    expect(useTypingStore.getState().isComposing).toBe(true)
  })

  test('onCompositionEnd → isComposing = false + 글자 확정', () => {
    const { result } = renderHook(() => useTypingEngine())

    act(() => {
      result.current.inputHandlers.onCompositionStart()
    })
    act(() => {
      result.current.inputHandlers.onCompositionEnd({
        currentTarget: { value: '가' },
      } as React.CompositionEvent<HTMLInputElement>)
    })

    const state = useTypingStore.getState()
    expect(state.isComposing).toBe(false)
    expect(state.userInput).toBe('가')
  })
})

// ─────────────────────────────────────────────
// onChange — 이중 호출 방지
// ─────────────────────────────────────────────
describe('onChange 이중 호출 방지', () => {
  test('compositionEnd 직후 onChange는 handleInput을 다시 호출하지 않는다', () => {
    const { result } = renderHook(() => useTypingEngine())

    act(() => {
      result.current.inputHandlers.onCompositionStart()
    })
    // compositionEnd에서 '가'를 확정
    act(() => {
      result.current.inputHandlers.onCompositionEnd({
        currentTarget: { value: '가' },
      } as React.CompositionEvent<HTMLInputElement>)
    })

    // 직후 onChange가 같은 값으로 발화돼도 이중 호출 방지
    act(() => {
      result.current.inputHandlers.onChange({
        target: { value: '가' },
      } as React.ChangeEvent<HTMLInputElement>)
    })

    // userInput은 여전히 '가' (두 번 처리되지 않음)
    expect(useTypingStore.getState().userInput).toBe('가')
    expect(useTypingStore.getState().mistakes).toBe(0)
  })

  test('두 번째 onChange는 정상 처리된다 (플래그 리셋 확인)', () => {
    const { result } = renderHook(() => useTypingEngine())

    act(() => {
      result.current.inputHandlers.onCompositionStart()
      result.current.inputHandlers.onCompositionEnd({
        currentTarget: { value: '가' },
      } as React.CompositionEvent<HTMLInputElement>)
    })

    // 첫 번째 onChange — 이중 호출 방지로 스킵
    act(() => {
      result.current.inputHandlers.onChange({
        target: { value: '가' },
      } as React.ChangeEvent<HTMLInputElement>)
    })

    // 두 번째 onChange (비조합) — 정상 처리
    act(() => {
      result.current.inputHandlers.onChange({
        target: { value: '가나' },
      } as React.ChangeEvent<HTMLInputElement>)
    })

    expect(useTypingStore.getState().userInput).toBe('가나')
  })
})

// ─────────────────────────────────────────────
// onChange — 조합 중 차단
// ─────────────────────────────────────────────
describe('onChange 조합 중 차단', () => {
  test('조합 중 onChange는 handleInput을 호출하지 않는다', () => {
    const { result } = renderHook(() => useTypingEngine())

    act(() => {
      result.current.inputHandlers.onCompositionStart()
    })
    act(() => {
      result.current.inputHandlers.onChange({
        target: { value: 'ㄱ' },
      } as React.ChangeEvent<HTMLInputElement>)
    })

    // 조합 중에는 userInput이 변경되지 않아야 함
    expect(useTypingStore.getState().userInput).toBe('')
  })
})

// ─────────────────────────────────────────────
// onKeyDown — Backspace
// ─────────────────────────────────────────────
describe('onKeyDown Backspace', () => {
  test('비조합 Backspace → handleBackspace 호출 + preventDefault', () => {
    const { result } = renderHook(() => useTypingEngine())
    const preventDefault = jest.fn()

    act(() => {
      useTypingStore.getState().handleInput('가나')
    })
    act(() => {
      result.current.inputHandlers.onKeyDown({
        key: 'Backspace',
        preventDefault,
      } as unknown as React.KeyboardEvent<HTMLInputElement>)
    })

    expect(preventDefault).toHaveBeenCalled()
    expect(useTypingStore.getState().userInput).toBe('가ㄴ')
  })

  test('조합 중 Backspace → handleBackspace 호출하지 않고 브라우저에 위임', () => {
    const { result } = renderHook(() => useTypingEngine())
    const preventDefault = jest.fn()

    act(() => {
      useTypingStore.getState().handleInput('가')
    })
    // 조합 시작 (예: "나" 입력 중 ㄴ 단계)
    act(() => {
      result.current.inputHandlers.onCompositionStart()
    })
    act(() => {
      result.current.inputHandlers.onKeyDown({
        key: 'Backspace',
        preventDefault,
      } as unknown as React.KeyboardEvent<HTMLInputElement>)
    })

    // 조합 중에는 preventDefault를 호출하지 않고 브라우저/IME에 위임
    expect(preventDefault).not.toHaveBeenCalled()
    // 확정 텍스트는 변하지 않아야 함
    expect(useTypingStore.getState().userInput).toBe('가')
  })

  test('조합 중 Enter → preventDefault', () => {
    const { result } = renderHook(() => useTypingEngine())
    const preventDefault = jest.fn()

    act(() => {
      result.current.inputHandlers.onCompositionStart()
    })
    act(() => {
      result.current.inputHandlers.onKeyDown({
        key: 'Enter',
        preventDefault,
      } as unknown as React.KeyboardEvent<HTMLInputElement>)
    })

    expect(preventDefault).toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────
// state 노출 확인
// ─────────────────────────────────────────────
describe('state 노출', () => {
  test('초기 state 값 확인', () => {
    const { result } = renderHook(() => useTypingEngine())
    const { state } = result.current

    expect(state.userInput).toBe('')
    expect(state.cursorIndex).toBe(0)
    expect(state.mistakes).toBe(0)
    expect(state.accuracy).toBe(100)
    expect(state.isCompleted).toBe(false)
    expect(state.isShaking).toBe(false)
  })
})

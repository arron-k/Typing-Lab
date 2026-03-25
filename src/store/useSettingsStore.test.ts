import { useSettingsStore } from './useSettingsStore'

describe('useSettingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({ showHandOverlay: true })
  })

  it('기본값은 showHandOverlay: true', () => {
    expect(useSettingsStore.getState().showHandOverlay).toBe(true)
  })

  it('toggleHandOverlay: ON → OFF', () => {
    useSettingsStore.getState().toggleHandOverlay()
    expect(useSettingsStore.getState().showHandOverlay).toBe(false)
  })

  it('toggleHandOverlay: OFF → ON', () => {
    useSettingsStore.setState({ showHandOverlay: false })
    useSettingsStore.getState().toggleHandOverlay()
    expect(useSettingsStore.getState().showHandOverlay).toBe(true)
  })

  it('두 번 토글하면 원래 값으로 복귀', () => {
    useSettingsStore.getState().toggleHandOverlay()
    useSettingsStore.getState().toggleHandOverlay()
    expect(useSettingsStore.getState().showHandOverlay).toBe(true)
  })
})

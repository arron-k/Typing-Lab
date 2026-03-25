import { useSettingsStore } from './useSettingsStore'

describe('useSettingsStore', () => {
  it('초기 상태가 빈 객체', () => {
    expect(useSettingsStore.getState()).toEqual({})
  })
})

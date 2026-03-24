import type { KeyInfo, FingerType } from '@/types'

// 두벌식 표준 자판 배열
export const KEYBOARD_ROWS: KeyInfo[][] = [
  // 숫자 행
  [
    { key: '`',  label: '`',  finger: 'left-pinky' },
    { key: '1',  label: '1',  finger: 'left-pinky' },
    { key: '2',  label: '2',  finger: 'left-ring' },
    { key: '3',  label: '3',  finger: 'left-middle' },
    { key: '4',  label: '4',  finger: 'left-index' },
    { key: '5',  label: '5',  finger: 'left-index' },
    { key: '6',  label: '6',  finger: 'right-index' },
    { key: '7',  label: '7',  finger: 'right-index' },
    { key: '8',  label: '8',  finger: 'right-middle' },
    { key: '9',  label: '9',  finger: 'right-ring' },
    { key: '0',  label: '0',  finger: 'right-pinky' },
    { key: '-',  label: '-',  finger: 'right-pinky' },
    { key: '=',  label: '=',  finger: 'right-pinky' },
    { key: 'backspace', label: '←', width: 1.5, finger: 'right-pinky' },
  ],
  // QWERTY 행 (두벌식: ㅂㅈㄷㄱㅅ / ㅛㅕㅑㅐㅔ)
  [
    { key: 'tab', label: 'Tab', width: 1.5, finger: 'left-pinky' },
    { key: 'q', label: 'ㅂ', shiftLabel: 'ㅃ', finger: 'left-pinky' },
    { key: 'w', label: 'ㅈ', shiftLabel: 'ㅉ', finger: 'left-ring' },
    { key: 'e', label: 'ㄷ', shiftLabel: 'ㄸ', finger: 'left-middle' },
    { key: 'r', label: 'ㄱ', shiftLabel: 'ㄲ', finger: 'left-index' },
    { key: 't', label: 'ㅅ', shiftLabel: 'ㅆ', finger: 'left-index' },
    { key: 'y', label: 'ㅛ', finger: 'right-index' },
    { key: 'u', label: 'ㅕ', finger: 'right-index' },
    { key: 'i', label: 'ㅑ', finger: 'right-middle' },
    { key: 'o', label: 'ㅐ', shiftLabel: 'ㅒ', finger: 'right-ring' },
    { key: 'p', label: 'ㅔ', shiftLabel: 'ㅖ', finger: 'right-pinky' },
    { key: '[', label: '[', finger: 'right-pinky' },
    { key: ']', label: ']', finger: 'right-pinky' },
    { key: '\\', label: '\\', width: 1.5, finger: 'right-pinky' },
  ],
  // 홈 로우 (두벌식: ㅁㄴㅇㄹㅎ / ㅗㅓㅏㅣ)
  [
    { key: 'capslock', label: 'Caps', width: 1.75, finger: 'left-pinky' },
    { key: 'a', label: 'ㅁ', finger: 'left-pinky' },
    { key: 's', label: 'ㄴ', finger: 'left-ring' },
    { key: 'd', label: 'ㅇ', finger: 'left-middle' },
    { key: 'f', label: 'ㄹ', finger: 'left-index' },
    { key: 'g', label: 'ㅎ', finger: 'left-index' },
    { key: 'h', label: 'ㅗ', finger: 'right-index' },
    { key: 'j', label: 'ㅓ', finger: 'right-index' },
    { key: 'k', label: 'ㅏ', finger: 'right-middle' },
    { key: 'l', label: 'ㅣ', finger: 'right-ring' },
    { key: ';', label: ';', finger: 'right-pinky' },
    { key: "'", label: "'", finger: 'right-pinky' },
    { key: 'enter', label: 'Enter', width: 2.25, finger: 'right-pinky' },
  ],
  // 하단 자음 행 (ㅋㅌㅊㅍ / ㅠㅜㅡ)
  [
    { key: 'shift-l', label: 'Shift', width: 2.25, finger: 'left-pinky' },
    { key: 'z', label: 'ㅋ', finger: 'left-pinky' },
    { key: 'x', label: 'ㅌ', finger: 'left-ring' },
    { key: 'c', label: 'ㅊ', finger: 'left-middle' },
    { key: 'v', label: 'ㅍ', finger: 'left-index' },
    { key: 'b', label: 'ㅠ', finger: 'left-index' },
    { key: 'n', label: 'ㅜ', finger: 'right-index' },
    { key: 'm', label: 'ㅡ', finger: 'right-index' },
    { key: ',', label: ',', finger: 'right-middle' },
    { key: '.', label: '.', finger: 'right-ring' },
    { key: '/', label: '/', finger: 'right-pinky' },
    { key: 'shift-r', label: 'Shift', width: 2.75, finger: 'right-pinky' },
  ],
  // 스페이스 행
  [
    { key: 'ctrl-l', label: 'Ctrl', width: 1.25, finger: 'left-pinky' },
    { key: 'win',    label: '⊞',   width: 1.25, finger: 'left-thumb' },
    { key: 'alt-l',  label: 'Alt',  width: 1.25, finger: 'left-thumb' },
    { key: ' ',      label: '',     width: 5.5,  finger: 'left-thumb' },
    { key: 'alt-r',  label: 'Alt',  width: 1.25, finger: 'right-thumb' },
    { key: 'ctrl-r', label: 'Ctrl', width: 1.25, finger: 'right-pinky' },
  ],
]

// 홈 로우 키 집합 (항상 연핑크로 표시)
export const HOME_ROW_KEYS = new Set([
  'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';',
])

// 손가락별 색상 (디버그/시각화용)
export const FINGER_COLORS: Record<FingerType, string> = {
  'left-pinky':   '#FFB3B3',
  'left-ring':    '#FFD9B3',
  'left-middle':  '#FFFFB3',
  'left-index':   '#B3FFB3',
  'left-thumb':   '#B3D9FF',
  'right-thumb':  '#B3D9FF',
  'right-index':  '#B3FFB3',
  'right-middle': '#FFFFB3',
  'right-ring':   '#FFD9B3',
  'right-pinky':  '#FFB3B3',
}

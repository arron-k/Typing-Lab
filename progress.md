# Typing Lab — 개발 진행 현황 (Progress)

---

## 최근 업데이트: 2026-03-24

---

## Phase 1 진행 현황

### 완료된 작업

| STEP | 내용 | 파일 |
|------|------|------|
| 0 | 프로젝트 세팅 | `package.json`, `tsconfig.json`, `globals.css` |
| 1 | 타입 정의 | `src/types/index.ts` |
| 2 | 커리큘럼 JSON | `src/data/stages/stage1~4.json`, `src/lib/curriculum.ts` |
| 3 | Zustand 스토어 | `src/store/useTypingStore.ts`, `useUserStore.ts`, `useProgressStore.ts` |
| 4 | 유틸 함수 | `src/lib/hangul.ts`, `src/lib/scoring.ts` |
| 5 | Auth 레이어 | `src/hooks/useAuth.ts`, `src/components/auth/LoginForm.tsx`, `PinInput.tsx` |
| 6 | 가상 키보드 | `src/components/keyboard/VirtualKeyboard.tsx`, `KeyCap.tsx`, `HandOverlay.tsx`, `keymap.ts` |
| 7 | 타이핑 화면 | `src/components/typing/TypingArea.tsx`, `TypingText.tsx`, `QuizPopup.tsx` |
| 8 | 학습 플로우 | `src/app/dashboard/page.tsx`, `src/app/stage/[stageId]/[stepId]/page.tsx` |
| 9 | 결과 모달 | `src/components/typing/ResultModal.tsx`, `src/components/character/LeoAvatar.tsx` |

### 빌드 상태
- TypeScript 컴파일: ✅ 오류 없음
- Next.js 프로덕션 빌드: ✅ 성공

```
Route (app)
├ ○ /
├ ○ /dashboard
├ ○ /login
└ ƒ /stage/[stageId]/[stepId]
```

### 미완료 (Phase 1 잔여)

| 항목 | 우선순위 | 비고 |
|------|---------|------|
| Jest 테스트 환경 설정 | 높음 | TDD 원칙 준수 필요 |
| `lib/hangul.test.ts` | 높음 | 백스페이스 오토마타 검증 |
| `lib/scoring.test.ts` | 높음 | WPM/별점/EXP 경계값 검증 |
| `store/useTypingStore.test.ts` | 중간 | 세션 시나리오 검증 |
| GitHub 원격 푸시 | 높음 | MCP 경유 시도 필요 |

---

## 커밋 히스토리

| 날짜 | 커밋 | 내용 |
|------|------|------|
| 2026-03-24 | `9928414` | feat: Phase 1 타이핑 학습 서비스 전체 구현 |
| 2026-03-24 | `3246f82` | Initial commit |

---

## 기술적 결정 사항

### 해결된 이슈
- **es-hangul API 변경**: `assembleHangul` → `assemble` 로 수정
- **TypeScript 변수 재선언**: `isCompleted` 섀도잉 → `alreadyCompleted`, `newIsCompleted` 로 분리
- **scoring.ts 타입 오류**: `mustComplete` 프로퍼티 접근 시 `'mustComplete' in condition` 타입 가드 추가
- **Google Fonts 네트워크 차단**: Geist 폰트 제거 → 시스템 폰트 스택으로 대체

### 보류 중인 결정
- **WPM vs CPM**: 현재 CPM을 2.5로 나눠 WPM 변환 중. 한국어 타자는 CPM이 일반적 — 추후 재검토
- **PIN 보안**: Phase 1은 평문 저장. Phase 2 Supabase Auth 전환 시 보안 강화
- **스테이지 클리어 보너스**: Stage 1=50, 2=100, 3=150, 4=200 EXP (PRD 미명시, 자체 설정)

---

## 다음 작업 예정

1. **TDD 테스트 환경 구축** — Jest + RTL 설정
2. **단위 테스트 작성** — hangul, scoring, useTypingStore
3. **GitHub 원격 브랜치 푸시** — MCP push_files 활용

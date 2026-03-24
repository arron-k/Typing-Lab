# Typing Lab — 개발 계획 (Plan)

> 초등학교 4학년 맞춤형 융합 타자 학습 서비스

---

## Phase 1 — MVP 코어 (현재)

### STEP 0. 프로젝트 세팅
- [x] Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- [x] Zustand v5, es-hangul 의존성 설치
- [x] 디렉토리 구조 생성
- [x] globals.css 커스텀 애니메이션 (shake, star-pop, count-up, cursor-blink)
- [ ] Jest + React Testing Library 테스트 환경 설정

### STEP 1. 타입 정의
- [x] PRD 명세 인터페이스 (`User`, `Progress`, `QuizOption`, `TypingData`)
- [x] 추가 타입 (`StageData`, `StepData`, `StarConditions`, `SessionResult`, `QuizState`, `KeyInfo`, `FingerType`)

### STEP 2. 커리큘럼 데이터 JSON
- [x] Stage 1: 자리 연습 (8 steps) — 홈 로우 점진적 학습
- [x] Stage 2: 낱말 연습 (10 steps) — 과학/국어 어휘
- [x] Stage 3: 짧은 글 (8 steps) — 과학 팩트 + 맞춤법 퀴즈
- [x] Stage 4: 긴 글 (6 steps) — 과학 지문 + 독해 퀴즈
- [x] `lib/curriculum.ts` 데이터 로드 유틸 (Phase 2: Supabase 교체 지점)

### STEP 3. Zustand 스토어
- [x] `useTypingStore` — 타이핑 엔진 핵심 상태
- [x] `useUserStore` — 유저 세션, EXP, 레벨 (persist)
- [x] `useProgressStore` — 스텝별 진행도, 별점, 해금 (persist)
- [ ] 스토어 단위 테스트 (TDD)

### STEP 4. 유틸 함수
- [x] `lib/hangul.ts` — 백스페이스 오토마타 분해 (es-hangul)
- [x] `lib/scoring.ts` — WPM, 정확도, 별점, EXP, 출석보너스
- [ ] `lib/hangul.test.ts` — 오토마타 분해 단위 테스트
- [ ] `lib/scoring.test.ts` — 경계값 단위 테스트

### STEP 5. Auth 레이어
- [x] `hooks/useAuth.ts` — LocalStorage 기반 (Phase 2: Supabase 교체 지점)
- [x] `LoginForm.tsx`, `PinInput.tsx`

### STEP 6. 가상 키보드
- [x] `keymap.ts` — 두벌식 배열 + 손가락 매핑
- [x] `KeyCap.tsx` — 상태별 색상 (타겟/홈로우/기본)
- [x] `HandOverlay.tsx` — 손가락 실루엣 SVG 오버레이
- [x] `VirtualKeyboard.tsx` — 통합 컴포넌트

### STEP 7. 타이핑 화면
- [x] `hooks/useTypingEngine.ts` — IME 이벤트 핸들러 통합
- [x] `TypingText.tsx` — 글자별 색상 피드백 + 커서
- [x] `QuizPopup.tsx` — 맞춤법 퀴즈 선택 팝업
- [x] `TypingArea.tsx` — 타이핑 세션 통합 컨테이너

### STEP 8. 학습 플로우 & 라우팅
- [x] `app/dashboard/page.tsx` — 스테이지 맵
- [x] `app/stage/[stageId]/[stepId]/page.tsx` — 학습 세션
- [x] `StageCard.tsx`, `StepNode.tsx` — 진행도 UI

### STEP 9. 결과 모달 & 보상 연출
- [x] `ResultModal.tsx` — 별점 순차 등장 + EXP 카운트업
- [x] `LeoAvatar.tsx` — 레벨별 복장 (이모지, Phase 2: 3D 교체)

### 미완료 (Phase 1 잔여)
- [ ] Jest 테스트 환경 설정 (`jest.config.ts`, `jest.setup.ts`)
- [ ] `lib/hangul.test.ts` 단위 테스트
- [ ] `lib/scoring.test.ts` 단위 테스트
- [ ] `store/useTypingStore.test.ts` 단위 테스트
- [ ] GitHub 원격 브랜치 푸시 (MCP 경유)

---

## Phase 2 — 3D & Supabase 연동

- [ ] Supabase 프로젝트 생성 + 테이블 마이그레이션
  - `users`, `progress`, `typing_data` 테이블 + RLS 정책
- [ ] `hooks/useAuth.ts` 내부를 Supabase Auth로 교체
- [ ] `lib/curriculum.ts` 내부를 Supabase 쿼리로 교체
- [ ] React Three Fiber (R3F) 도입
  - `dynamic import + ssr:false` 처리
  - 레오 3D 캐릭터 컴포넌트
  - 레벨별 복장/배경 에셋 전환
- [ ] Vercel 배포 + 환경변수 설정

---

## Phase 3 — 미니게임

- [ ] 매트릭스 회피 액션 — R3F 씬 + 슬로우모션 타임라인
- [ ] 우주 쓰레기차 맹추격전 — 러닝 게임 씬 + 옆 차선 카메라
- [ ] 미니게임 결과 → `SessionResult` → `Progress` 반영

---

## 별점 기준 (PRD 6.1항)

| Stage | ⭐ 해금 | ⭐⭐⭐ 퍼펙트 |
|-------|--------|------------|
| 1 자리 | 정확도 80% | 오타 0회 |
| 2 낱말 | 정확도 80% + 완주 | 정확도 95% + WPM 100 |
| 3 짧은 글 | WPM 70 + 오타 ≤5 | WPM 150 + 퀴즈 100% |
| 4 긴 글 | 완주 | WPM 180 + 퀴즈 100% |

## EXP 공식 (PRD 6.2항)

```
EXP = (타수 × 1) × 정확도배수(95%↑ → 1.5x) + 스테이지 클리어 보너스
클리어 보너스: Stage 1=50, 2=100, 3=150, 4=200
일일 출석 보너스: +300 EXP (당일 최초 스텝 완료 시)
```

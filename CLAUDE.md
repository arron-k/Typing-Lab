@AGENTS.md

# Typing Lab — AI 개발 가이드

## 개발 원칙

### Test-Driven Development (TDD)
- 코드 작성 전 반드시 테스트를 먼저 작성한다
- Red → Green → Refactor 사이클을 따른다
- 모든 비즈니스 로직(scoring, hangul, store)은 단위 테스트 필수
- 컴포넌트는 핵심 인터랙션에 대한 테스트를 작성한다
- `npm test` 또는 `npm run test:watch`로 검증 후 커밋한다

### 코드 스타일
- 코드 내 주석은 최소화한다 — 로직이 자명하면 주석 불필요
- 복잡한 알고리즘(한글 오토마타 등)에만 핵심 설명 주석 허용
- 함수/변수명으로 의도를 표현한다

### 아키텍처 원칙
- Phase 1 → Phase 2 전환을 고려한 추상화 레이어 유지
  - `lib/curriculum.ts`: JSON → Supabase 쿼리 교체 지점
  - `hooks/useAuth.ts`: LocalStorage → Supabase Auth 교체 지점
  - `components/character/LeoAvatar.tsx`: 이모지 → R3F 3D 교체 지점
- `use client` 경계를 명시적으로 관리한다
- Zustand 스토어는 순수 함수로 유지, 사이드이펙트 최소화

### 커밋 규칙
- feat: 새 기능
- fix: 버그 수정
- test: 테스트 추가/수정
- refactor: 리팩토링
- docs: 문서 업데이트

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| State | Zustand v5 |
| 한글 처리 | es-hangul |
| Testing | Jest + React Testing Library |
| 3D (Phase 2) | React Three Fiber + Drei |
| Backend (Phase 2) | Supabase (PostgreSQL + Auth + RLS) |
| Deploy | Vercel |

## 디렉토리 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── login/
│   ├── dashboard/
│   └── stage/[stageId]/[stepId]/
├── components/
│   ├── auth/               # LoginForm, PinInput
│   ├── character/          # LeoAvatar (Phase 2: R3F 교체)
│   ├── dashboard/          # StageCard, StepNode
│   ├── keyboard/           # VirtualKeyboard, KeyCap, HandOverlay
│   └── typing/             # TypingArea, TypingText, QuizPopup, ResultModal
├── store/                  # Zustand 스토어 3종
├── types/                  # TypeScript 인터페이스
├── lib/                    # 유틸 함수 (hangul, scoring, curriculum)
├── hooks/                  # useAuth, useTypingEngine
└── data/stages/            # 커리큘럼 JSON (Phase 2: Supabase로 이관)
```

## 브랜치 전략

- 개발 브랜치: `claude/typing-learning-service-design-2F4a1`
- main으로 직접 push 금지

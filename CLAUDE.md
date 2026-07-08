# Duet — 커플 캘린더·아카이브

"데이트 = 트랙, 한 달 = 플레이리스트, 기념일 = 싱글" 컨셉의 커플 앱.
기능·데이터·서버 사양은 기술 PRD(대화로 전달됨), UI는 `design-mockup/`(Claude Design 목업)이 원본.

## 스택 (M0에서 확정)

- Expo SDK 57 + React Native 0.86 + TypeScript strict + expo-router (src/app 파일 라우팅)
- NativeWind v4 (토큰은 `tailwind.config.js` + `src/theme/tokens.ts`)
- Supabase: Auth·Postgres·Storage·Realtime·Edge Functions (별도 백엔드 없음)
- TanStack Query(+AsyncStorage persist) / Zustand(최소) / FlashList / expo-image
- Sentry(@sentry/react-native), 카카오: `@react-native-kakao/{core,user}`

### 라이브러리 교체 기록 (PRD §1 규칙)

- 카카오 SDK: PRD 후보 확인 결과 `@react-native-seoul/kakao-login`(2025-10 마지막 업데이트) 대신
  **`@react-native-kakao/*`** 선택 — 더 활발한 유지보수(2026-03), Expo config plugin 공식 지원.

## 불변 규칙

- **모든 색상은 토큰 참조** — hex 하드코딩 금지 (PRD §6.2). 3역할 규약: 나=green / 상대=pink / 기념일=amber (`src/theme/tokens.ts`의 `role`)
- **모든 날짜 연산은 Asia/Seoul 고정** — `src/lib/date.ts` 경유. `new Date()` 직접 비교 금지
- **tracks에 상태 컬럼 없음** — `date < today(KST)` → released, `isReleased()` 사용 (PRD §7.2)
- 시크릿은 Edge Function 뒤로 (네이버 API 키 등 클라이언트 노출 금지)
- 목업 사진(`design-mockup/assets/`)은 참조 전용 — 앱 번들·시드에 사용 금지 (PRD §6.5)

## 아키텍처 규칙 (SOLID·Clean Architecture 실용 적용)

교과서식 4계층 대신 **의존성 방향**만 강제한다. 방향: `app/(라우트) → components/ → api/·lib/ → theme/·types/`

- **lib/ 는 순수 함수만** — React·Supabase·RN import 금지. 도메인 규칙(날짜, D-day, 기념일, released 판정)은 전부 여기. 유일한 단위 테스트 대상
- **Supabase 접근은 api/ 로만** — 화면·컴포넌트에서 `supabase` 직접 import 금지. 쿼리는 api/에 훅(TanStack Query)으로 캡슐화 (DIP: 화면은 "데이터 훅"에만 의존)
- **components/ 는 props-only** — 전역 상태·네트워크 접근 금지, 표현만 (SRP). 도메인 분기가 필요하면 lib/ 함수를 받아쓰기
- **화면(app/)은 조합만** — 훅 호출 + 컴포넌트 배치. 비즈니스 로직이 화면에 생기면 lib/ 또는 api/로 내린다
- **확장은 variant/prop으로** (OCP) — 예: NextUp의 track/anniv variant처럼. 역할 분기는 `OwnerRole` 타입으로 닫는다
- 서버 규칙(초대 수락 트랜잭션, 기념일 생성)은 Edge Function이 단일 진실 — 클라이언트 lib/와 규칙이 겹치면 테스트로 동치 검증

과잉 금지: repository 인터페이스·DI 컨테이너·usecase 클래스 도입하지 않는다. 계층이 아니라 방향이 규칙이다.

## 명령

- `npm test` — lib 단위 테스트 (date/D-day/기념일 — 유일한 테스트 대상)
- `npm run typecheck` — tsc strict
- `npx supabase start` / `db reset` — 로컬 스택 (Docker 필요)
- `npx supabase gen types typescript --local > src/types/database.types.ts` — 스키마 변경 후 타입 재생성
- 카카오 로그인은 Expo Go 불가 — dev client: `npx expo run:android|ios` (KAKAO_NATIVE_APP_KEY 필요, `.env`)

## 구조 메모

- `src/app/` 라우트: (auth) / (tabs)/{playlist,calendar,studio} / track/[id] / place/[id] / modals
- 탭바는 커스텀 (`CoupleTabBar` = NextUp 미니플레이어 + 3탭, 목업 AppChrome 대응)
- 캘린더 월간 그리드는 라이브러리 없이 자체 구현 예정 (PRD §3, §6.3 성능 요구)
- Edge Functions: `claim-invite`(M1), `search-places`(M3) — 골격만 존재
- `couple_members.user_id`는 unique(유저당 커플 1개), RLS 공통 술어는 `public.my_couple_id()`

## 마일스톤 현황

- [x] M0 스캐폴드 (본 커밋)
- [ ] M1 인증·연결 / M2 캘린더 / M3 Track / M4 플레이리스트·Place / M5 푸시·베타 / M6 스토어

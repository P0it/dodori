# 도돌이(dodori) — 커플 공용 공간

둘이 매일 여는 하나의 앱. **홈**의 주제로 말을 섞고, **캘린더**에서 일정을 함께 잡고,
**라이브러리**에 데이트를 쌓고 가고 싶은 곳을 쟁여두고, **피드**에서 남긴 것을 돌아본다 (= 4탭).
음악 메타포: 장소 = 트랙, 하루(데이트) = 앨범, 플레이리스트 = 시간순으로 늘어선 우리 데이트.
탭 이름은 **라이브러리**(2026-07-31) — 그 안이 `플레이리스트`(앨범 캐러셀) + `가보고 싶은 곳`(찜 목록)이다.
UI의 "가보고 싶은 곳" = 코드의 `playlists`(테이블·훅·라우트) — 내부 이름은 바꾸지 않았다.
**"싱글(기념일)" 개념은 폐기** — 기념일은 캘린더의 일이다.

구 서비스명 Duet에서 리브랜딩(2026-07). 로고·인앱 마크는 여는 도돌이표 𝄆 — #121212 배경 + 브랜드 그린 단색.
표기 규칙: 한글 표기는 **"도돌이"**(런처 앱 이름·app.json `name`), 로마자·인앱 워드마크·웹 타이틀은
**소문자 dodori**(`web.name`·`web.shortName`). "도도리"는 폐기 — 마크의 유래인 음악 기호 "도돌이표"와 결이 맞는 쪽으로 돌아왔다.
2026-08-04에 첫 글자 대문자(Dodori)를 시도했다가 **눈으로 보고 소문자로 되돌렸다** — 다시 제안하지 말 것.
웹 빌드에서 실제로 쓰이는 매니페스트는 **`public/manifest.json`**이다 — `expo export`가 그대로 복사해
`app.json`의 `web.name`·`web.shortName`은 웹에서 아무 효과가 없다(확인: dist/manifest.json == public/manifest.json).
거기 `name`·`short_name`은 **홈 화면 아이콘 이름**이라 한글 "도돌이"가 맞고(런처 규칙), 브라우저 탭 제목
(`public/index.html`의 `<title>`)만 소문자 dodori다. 이름을 바꾸려면 app.json이 아니라 이 두 파일을 고칠 것.

## 사양의 출처 (순서대로)

1. `docs/superpowers/specs/` — **최신 결정이 여기 있다.** 방향 전환(오늘의 주제, 커플 피드, 플레이리스트 재정의)은 전부 PRD 이후에 나왔다
2. 기술 PRD(대화로 전달됨) — M0~M5 기반 사양. 위 스펙과 충돌하면 **PRD가 낡은 것**이다
3. `design-mockup/`(Claude Design 목업) — UI 원본. 단, 4탭 전환 이후 화면은 목업에 없다

## 스택 (M0에서 확정)

- Expo SDK 57 + React Native 0.86 + TypeScript strict + expo-router (src/app 파일 라우팅)
- 스타일은 RN `style` + 토큰(`src/theme/tokens.ts`) — NativeWind 미사용
- Supabase: Auth·Postgres·Storage·Realtime·Edge Functions (별도 백엔드 없음)
- TanStack Query(+AsyncStorage persist) / Zustand(최소) / FlashList / expo-image
- Sentry(@sentry/react-native), 카카오: `@react-native-kakao/{core,user}`

### 라이브러리 교체 기록 (PRD §1 규칙)

- 카카오 SDK: PRD 후보 확인 결과 `@react-native-seoul/kakao-login`(2025-10 마지막 업데이트) 대신
  **`@react-native-kakao/*`** 선택 — 더 활발한 유지보수(2026-03), Expo config plugin 공식 지원.
- NativeWind v4: **제거**. `className` 사용처가 0인데 `jsxImportSource: 'nativewind'`가 모든 JSX를
  css-interop으로 감싸면서 `Pressable`의 함수형 `style`(`({pressed}) => …`)을 조용히 버렸다
  (카카오 버튼이 배경 없이 렌더링). RN 0.86 Metro 패치 우회(`forceWriteFileSystem`)도 함께 불필요해짐.

## 불변 규칙

- **모든 색상은 토큰 참조** — hex 하드코딩 금지 (PRD §6.2)
- **색으로 사람을 구분하지 않는다** (2026-07, 구 3역할 규약 폐기) — "나=green / 상대=pink"는 보는 사람마다 반대로 보여
  같이 화면을 볼 때 혼선이 됐다. 누가 썼는지는 **이름·아바타**로만 표시한다. green(`color.accent`)은 브랜드 강조,
  amber(`color.anniv`)는 기념일, 보라(`color.date`)는 데이트 — 전부 종류지 사람이 아니다.
  일정 색은 등록할 때 고르는 **일정의 속성**(`eventColor` 6색 팔레트 → `events.color`에 키로 저장)
- **모든 날짜 연산은 Asia/Seoul 고정** — `src/lib/date.ts` 경유. `new Date()` 직접 비교 금지
- **tracks에 상태 컬럼 없음** — `date < today(KST)` → released, `isReleased()` 사용 (PRD §7.2)
- 시크릿은 Edge Function 뒤로 (네이버 API 키 등 클라이언트 노출 금지)
- 목업 사진(`design-mockup/assets/`)은 참조 전용 — 앱 번들·시드에 사용 금지 (PRD §6.5)

## 작업 방식 — Karpathy Guidelines

코드 작성·수정·리팩토링 시 항상 적용 ([andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills), 스킬 `karpathy-guidelines` 원문):

1. **Think Before Coding** — 가정을 명시하고, 해석이 여러 개면 제시하고 고른다. 불명확하면 멈추고 묻는다. 더 단순한 방법이 있으면 말한다
2. **Simplicity First** — 요청을 푸는 최소 코드만. 단일 사용 코드에 추상화 금지, 요청 없는 설정성·불가능한 시나리오의 에러 처리 금지
3. **Surgical Changes** — 요청과 무관한 코드·주석·포맷을 "개선"하지 않는다. 내 변경이 만든 고아(import 등)만 정리. 모든 변경 라인은 요청으로 추적 가능해야 함
4. **Goal-Driven Execution** — 작업을 검증 가능한 목표로 변환("버그 수정" → "재현 테스트 작성 후 통과"). 다단계 작업은 단계별 verify를 붙인 계획을 먼저 제시

## 커밋 규칙

작업이 끝나면 **기능 단위로 커밋하고 push까지 자동으로** 한다 (물어보지 않는다). 브랜치는 `main`.

- 단위는 유연하게 — 대략 기능 하나가 기준이되, 나누는 데 품이 더 들면 묶는다.
  얽힌 변경(토큰 교체 등)이나 잔손질은 한 커밋으로 가고, 메시지에 무엇이 섞였는지만 적는다
- 커밋 전 `npm run typecheck` + `npm test` 통과 확인. 깨지면 커밋하지 않고 보고한다
- 메시지는 한글 Conventional Commits — `feat(feed): 인스타 배치 + 대댓글`
- DB 마이그레이션은 코드와 같은 커밋에. 원격 적용(`npx supabase db push`)과 타입 재생성도 같이 끝낸다
- **`git add -A` / `git commit -a` 금지 — 내가 만진 파일만 경로로 명시해서 스테이징한다.**
  여러 세션이 한 작업 트리를 공유하면 `-A`가 남의 미커밋 변경을 통째로 쓸어 담는다.
  실제로 2026-07-23 작업에서 두 번 발생했고 한 번은 그대로 push까지 됐다 — 커밋 메시지가
  내용을 설명하지 못하는 커밋이 남는다
- **두 번째 세션부터는 작업 트리를 반드시 분리한다** — `EnterWorktree` 도구, 또는
  `git worktree add ../dodori-<주제>`. 경로 명시 스테이징은 남의 변경이 커밋에 딸려가는 것만 막지
  **같은 파일을 동시에 고치는 것은 못 막는다** (2026-08-05에 `MonthGrid.tsx`에서 발생 — 내 한 줄과
  남의 미커밋 변경이 한 파일에 섞여 hunk 단위로 골라 스테이징해야 했다)
- 트리를 분리하지 못한 세션은: 작업 시작 전 `git status`로 남이 만지는 중인 파일을 확인하고
  그 파일은 피한다. 이미 섞였으면 파일을 통째로 `git add` 하지 말고 내 hunk만 골라 스테이징한다
  (`git diff -- <file>`에서 내 hunk만 남긴 패치를 `git apply --cached`)
- **원격 자원은 worktree로도 나뉘지 않는다** — 원격 Supabase는 하나다. 마이그레이션 push와
  `database.types.ts` 재생성은 한 번에 한 세션만. 다른 세션이 스키마를 건드리는 중이면 기다린다
- worktree 하나를 새로 만들면 `node_modules` 설치와 `.env` 복사가 필요하고, `ios/`·`android/`는
  gitignore라 prebuild를 다시 돌려야 한다 — 잠깐 고치고 말 작업이면 분리하지 말고 위 규칙으로 간다

## 아키텍처 규칙 (SOLID·Clean Architecture 실용 적용)

교과서식 4계층 대신 **의존성 방향**만 강제한다. 방향: `app/(라우트) → components/ → api/·lib/ → theme/·types/`

- **lib/ 는 순수 함수만** — React·Supabase·RN import 금지. 도메인 규칙(날짜, D-day, 기념일, released 판정)은 전부 여기. 유일한 단위 테스트 대상
- **Supabase 접근은 api/ 로만** — 화면·컴포넌트에서 `supabase` 직접 import 금지. 쿼리는 api/에 훅(TanStack Query)으로 캡슐화 (DIP: 화면은 "데이터 훅"에만 의존)
- **components/ 는 props-only** — 전역 상태·네트워크 접근 금지, 표현만 (SRP). 도메인 분기가 필요하면 lib/ 함수를 받아쓰기
- **화면(app/)은 조합만** — 훅 호출 + 컴포넌트 배치. 비즈니스 로직이 화면에 생기면 lib/ 또는 api/로 내린다
- **확장은 prop으로** (OCP) — 새 케이스가 생기면 컴포넌트 안에 if를 늘리지 말고 prop으로 받는다. 역할 분기는 `OwnerRole` 타입으로 닫는다 (나=green / 상대=pink)
- 서버 규칙(초대 수락 트랜잭션, 기념일 생성)은 Edge Function이 단일 진실 — 클라이언트 lib/와 규칙이 겹치면 테스트로 동치 검증

과잉 금지: repository 인터페이스·DI 컨테이너·usecase 클래스 도입하지 않는다. 계층이 아니라 방향이 규칙이다.

## 명령

- `npm test` — lib 단위 테스트 (date/D-day/기념일 — 유일한 테스트 대상)
- `npm run typecheck` — tsc strict
- **원격 Supabase에 바로 붙어서 작업한다 — 로컬 스택(`npx supabase start`)은 쓰지 않는다.**
  `.env`의 `EXPO_PUBLIC_SUPABASE_URL`은 원격(`https://iyqttrufrjeytntinsrb.supabase.co`),
  CLI는 같은 프로젝트에 link돼 있다. Docker Desktop이 부팅과 함께 뜨면 옛 `supabase_*_dodori`
  컨테이너가 restart 정책으로 되살아나 WSL VM이 7GB를 먹으니, 보이면 `npx supabase stop`으로 내린다
- `npx supabase db push` — 마이그레이션을 원격에 적용 (원격은 하나뿐이라 한 번에 한 세션만)
- `npx supabase gen types typescript --linked > src/types/database.types.ts` — 스키마 변경 후 타입 재생성
- 카카오 로그인은 Expo Go 불가 — dev client: `npx expo run:android|ios` (KAKAO_NATIVE_APP_KEY 필요, `.env`)

## iOS 베타 (TestFlight) — 빌드는 맥미니 M4에서 로컬로

Windows 작업 트리에서는 iOS 빌드가 불가능하다. 맥미니에 같은 저장소를 clone해서 빌드한다
(`ios/`·`android/`는 gitignore — CNG라 prebuild가 매번 생성).

- 일상 개발(맥): `npx expo run:ios --device` — dev client가 폰에 깔리고 이후 수정은 새로고침으로 반영
- 릴리스 빌드(맥): `npx eas-cli build -p ios --profile production --local` → `npx eas-cli submit -p ios`
  `--local`은 클라우드 대기열 없이 내 맥에서 돌리되 서명·환경변수는 EAS 설정을 그대로 쓴다
- 맥의 `.env`도 Windows와 같은 **원격 Supabase 값**을 쓴다 (양쪽 다 원격 직결).
  `KAKAO_NATIVE_APP_KEY`는 EAS 빌드용으로도 `eas env:create`에 등록해 둘 것
- 전제: Apple Developer Program(연 $99), 카카오 콘솔에 iOS 플랫폼·번들 ID `com.hyunwoo.dodori` 등록

## 구조 메모

- `src/app/` 라우트: (auth) / (tabs)/{home,calendar,playlist,feed} / topic/[id] / track/[id] / place/[id] / modals
  - `feed` = "피드" 탭. 게시물 피드·기념일·좋아요·설정
- 탭바는 커스텀 4탭 (`CoupleTabBar`) — NextUp 미니플레이어는 제거됨. 진입 첫 화면은 `home`
- **홈**: 하루 한 개의 대화주제. 내가 투표해야 상대 답이 열린다 (`lib/topics.ts`, 주제는 커플별 `seq` 순차 배정)
- 캘린더 월간 그리드는 라이브러리 없이 자체 구현 (`components/calendar/MonthGrid.tsx`) + 그 아래 인라인 아젠다
- **여러 날 일정**은 셀 안 칩이 아니라 셀 위를 가로지르는 **막대**(구글 캘린더식). 기하 계산은 전부
  `lib/span.ts`(순수·테스트 대상) — 주별 토막 나누기(`spanSegments`)·겹침 칸 배정(`assignLanes`).
  종일 일정의 `ends_at`은 **마지막 날 23:59:59**로 저장한다(그 날을 포함시키려고).
  `useMonthEvents`는 `starts_at`만 보면 안 된다 — 지난달에 시작해 넘어오는 일정을 놓친다
- 공휴일: `lib/holidays.ts`가 규칙으로 계산(양력 고정 + KASI 음양력 변환 + 대체공휴일, ~2050).
  계산 불가능한 임시공휴일·선거일만 `holidays_extra` 테이블 + `sync-holidays` cron이 채운다
- **오늘의 게임**: 홈 카드 → `/game`. 종목 7개는 요일 고정(`lib/games.ts`, epochDay+3 → 월=0),
  3판 상한·최고점·"내가 마쳐야 상대 공개"는 전부 서버(`submit_game_round` RPC + `has_played` RLS)가 강제
- Edge Functions: `claim-invite` / `search-places` / `daily-release` / `generate-anniversaries` / `sync-holidays` / `notify-game`
  / `leave-couple` / `delete-account`
- `couple_members.user_id`는 unique(유저당 커플 1개), RLS 공통 술어는 `public.my_couple_id()`
- **탈퇴·연결 해제**(2026-08-27): 정책은 "마지막 한 명이 나갈 때 파기" — 한 사람이 나가도 커플 기록은
  남고, 두 번째가 나가는 순간 파일까지 전부 지운다. 이 정책 때문에 **작성자 FK가 `auth.users`가 아니라
  `profiles`를 가리키고, `profiles`는 `auth.users`와 FK로 묶여 있지 않다** — 탈퇴하면 auth 계정만 사라지고
  profiles는 이름을 지운 껍데기로 남아 작성자 자리를 지킨다. 바꾸기 전엔 cascade가 걸린 테이블은 탈퇴 시
  기록이 통째로 사라졌고, 안 걸린 테이블은 FK 위반으로 `deleteUser`가 아예 실패했다.
  새 테이블의 작성자 컬럼도 `references public.profiles (id)`로 달 것 (계정 부속물인 `notifications`·
  `push_subscriptions`·`couple_members`만 `auth.users` cascade가 맞다).
  파기 순서는 **파일 먼저, DB 행 나중**(`_shared/leave.ts`) — 뒤집으면 경로를 잃어 고아 파일이 남는다
- **사진은 렌디션 2종**: 업로드할 때 기기에서 1080(본체)·360(목록)을 만들어 함께 올린다
  (`api/photos.ts`의 `RENDITION`). **서버 이미지 변환은 쓰지 않는다** — Pro 무료분이 원본 100장뿐이라
  Spend Cap에 걸리면 앱 전체 사진이 안 보인다. `renditions=false`인 옛 사진만 폴백으로 변환을 쓴다.
  `signedThumbUrl(path, kind, renditions)`에 **세 번째 인자를 빠뜨리면 신규 사진도 폴백을 탄다**(타입은 통과).
  삭제는 반드시 `storagePathsFor()` 경유 — 본체만 지우면 `_360`이 고아 파일로 남는다.
- **동영상**(2026-08-12, 스토리·게시물만): 사진과 **같은 `photos` 테이블·같은 버킷**을 쓰고
  구분은 본체 확장자 하나다(`.jpg`/`.mp4`). 경로 규칙은 전부 `lib/media.ts`.
  `renditionPath()`가 mp4를 포스터 JPEG로 매핑하므로 **그림이 필요한 화면은 영상을 그냥 사진으로 본다**
  (앨범 커버·캘린더·플레이리스트·장소는 무수정). 영상은 파일 3개 — `{uuid}.mp4`·`_poster.jpg`·`_360.jpg`.
  15초 상한, 업로드 전 기기에서 720p 압축(`react-native-compressor`, 웹은 원본+45MB 상한).
  재생용 mp4 서명은 `signedSourceUrls()`(썸네일과 캐시 키가 다르다). 설계: `docs/superpowers/specs/2026-08-12-video-upload-design.md`
- 커플당 쿼터는 **장수가 아니라 바이트 총량**이다 — `couples.storage_quota_bytes`(무료 200MB)와
  `photos.bytes` 합계를 `photos` insert 트리거가 강제하고, 합계 조회는 `storage_used_bytes()` RPC.
  15초 영상 하나가 사진 27장이라 장수로는 셀 수 없어 `photo_quota`는 폐기했다.
  한도에 닿아도 **기존 사진·영상은 지우지 않고 열람도 계속 된다**(새 업로드만 막는다).
  업로드가 중간에 실패하면 그 항목이 올린 파일을 되돌린다 — 스토리지 업로드가 insert보다 먼저라
  트리거가 거부하면 파일만 남았다
- **알림**(2026-08-18): 상대가 스토리·게시물·댓글을 남기면 `notifications` 행이 생기고 푸시가 나간다.
  행 생성은 **Postgres 트리거**(`enqueue_notification`)가 단일 진실 — 클라이언트가 부르면 앱이 죽었을 때
  유실되고 배지 숫자가 곧 틀어진다. `pushed_at is null`이 미발송 큐고, 발송은 **Vercel Function**
  (`api/notifications/deliver.ts`)이 한다 — Edge Function을 새로 늘리지 않는다.
  DB의 kicker(`kick_notification_worker`, pg_net)는 "지금 깨워달라" 신호일 뿐이라 **실패해도 되고,
  Supabase를 떠나면 cron 폴링으로 갈아끼우면 된다** (유일한 벤더 락인을 여기 가뒀다).
  `kind`(무슨 일)와 `target_kind`(스토리냐 게시물이냐)는 직교한다 — 댓글 알림은 둘 다에 달리므로
  `kind`만으로는 갈 경로를 못 정한다. 문구·경로는 `lib/notifications.ts`(순수함수)를 앱과 워커가 함께 쓴다.
  서비스워커(`public/sw.js`)는 DB를 못 읽으니 **배지 숫자는 서버가 payload에 실어 보낸다**.
  iOS는 홈 화면에 설치된 PWA에서만 되고, 권한 요청은 반드시 사용자 제스처 안에서 해야 한다.
  kicker가 유일한 신호였던 탓에 http_post 한 번이 유실되면 푸시가 조용히 사라졌다 — `notify-sweep`
  cron(매분, 미발송 행이 있을 때만)이 놓친 것을 주워 담는다(2026-08-27).
  설계: `docs/superpowers/specs/2026-08-18-web-push-notifications-design.md`
- 게시물 사진 프레임은 `lib/posts.ts`의 `postFrameRatio`(가로 16:9 ~ 세로 4:5 클램프) 하나로
  업로드 크롭(`PostCropSheet`)과 피드 표시(`PostCard`)가 같은 값을 쓴다 — 한쪽만 바꾸면 어긋난다.
  크롭 제스처는 스토리 편집기의 `StoryCanvas`·`cropToCanvas` 재사용(게시물은 `minScale=1`)

## 마일스톤 현황

- [x] M0 스캐폴드 / M1 인증·연결 / M2 캘린더 / M3 Track / M4 플레이리스트·Place / M5 Realtime·푸시·cron
- [x] 방향 전환(2026-07): 오늘의 주제 + 커플 피드 + 4탭
- [x] 플레이리스트 재정의 이행 — 장소=트랙 / 하루=앨범, 싱글 제거
- [x] 커플 아케이드 — 홈의 '오늘의 게임' (하루 한 종목·3판 최고점·내가 마쳐야 상대 공개)
- [ ] 동영상 업로드 + 바이트 쿼터 — 코드·마이그레이션은 끝, **기기 검증 남음**:
      `react-native-compressor` × RN 0.86 실동작(0단계 스파이크)과 웹 패스가 미검증이다
- [ ] 웹 푸시 알림 + 아이콘 배지 — 코드·마이그레이션은 끝, **VAPID 키 발급·환경변수·Vault 설정과
      기기 2대 검증이 남음** (아래 "배포 후 1회 수동 설정")
- [x] 출시 요건(2026-08-27): 이용약관·개인정보 처리방침(`/terms`·`/privacy`), 계정 삭제·연결 해제,
      알림 큐 폴백 cron, 쿼터 서버 검증 — **기능 검증은 남음**(탈퇴·연결 해제를 실제 계정 2개로 확인할 것)
- [ ] 베타 배포(EAS/TestFlight) → M6 스토어 준비

## 배포 후 1회 수동 설정

- **cron Vault 시크릿** (미설정 시 daily-release·sync-holidays가 조용히 스킵됨) — SQL Editor에서.
  ⚠️ `<SERVICE_ROLE_KEY>`를 **반드시 실제 키로 치환**할 것 — 예전에 이 자리 문자열이 그대로 저장돼
  cron이 401로 몇 달간 실패했다. 값은 Settings → API Keys의 `service_role` JWT(`eyJ`로 시작).
  `select vault.create_secret('eyJ...실제키...', 'service_role_key');`
  `select vault.create_secret('https://iyqttrufrjeytntinsrb.supabase.co', 'project_url');`
  이미 있으면 `create_secret`은 duplicate 에러 → `vault.update_secret((select id from vault.secrets where name='service_role_key'), 'eyJ...')`
- **네이버 검색 키** — `npx supabase secrets set NAVER_CLIENT_ID=... NAVER_CLIENT_SECRET=...`
- **공공데이터포털 키** (미설정 시 임시공휴일·선거일만 캘린더에 안 뜸 — 일반 공휴일은 계산되므로 정상) —
  한국천문연구원 특일정보 API 활용신청 후 `npx supabase secrets set DATA_GO_KR_KEY=...`
- **카카오 Android 키 해시** — 첫 빌드 후 debug keystore 해시를 카카오 콘솔 플랫폼 키에 등록
- **웹 푸시(VAPID)** — `npx web-push generate-vapid-keys`로 키쌍 1회 생성.
  Vercel에 추가할 변수는 4개: `EXPO_PUBLIC_VAPID_PUBLIC_KEY`(앱·워커 공용) `VAPID_PRIVATE_KEY`
  `NOTIFY_WORKER_SECRET` `SUPABASE_SERVICE_ROLE_KEY`. URL은 기존 `EXPO_PUBLIC_SUPABASE_URL`을
  워커가 재사용한다 — 같은 값을 두 이름으로 두면 한쪽만 바뀌었을 때 조용히 어긋난다.
  그리고 SQL Editor에서 (⚠️ 자리표시자 말고 **실제 값**으로):
  `select vault.create_secret('https://<vercel-domain>/api/notifications/deliver', 'notify_worker_url');`
  `select vault.create_secret('<NOTIFY_WORKER_SECRET>', 'notify_worker_secret');`
  미설정이면 알림 행은 쌓이지만 푸시가 안 나간다(앱 안 종 아이콘·목록은 정상 동작).

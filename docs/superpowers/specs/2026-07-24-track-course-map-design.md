# 트랙 코스 동선 지도 (Track Course Map)

작성일: 2026-07-24

## 목표

데이트 하루(=트랙/앨범)의 코스 장소들을 네이버 지도 위에 **순번 핀 + 직선 동선**으로
보여준다. 트랙 상세의 코스 섹션에서 "지도로 보기" 버튼을 눌러 전체화면 지도로 진입한다.

## 배경

- `places` 테이블엔 이미 `lat`/`lng`(WGS84)가 있다 — search-places Edge Function이 네이버
  지역검색의 카텍 좌표를 변환해 담기 시점에 저장한다. 지도에 찍을 데이터는 준비돼 있다.
- `track_places`가 트랙↔장소를 `sort_order`로 잇는다 = 코스 순서 = 동선.
- 지금 쓰는 건 네이버 **검색 API**(developers.naver.com)이고, 네이버 **지도**는 별개의
  **Naver Cloud Platform(NCP)** Maps 서비스다. 별도 클라이언트 ID가 필요하다.

## 결정 사항

브레인스토밍에서 확정한 선택:

1. **지도 위치**: 트랙(데이트 하루) 상세의 코스. (플레이리스트/전용 화면 아님)
2. **렌더링 방식**: 네이티브 SDK (`@mj-studio/react-native-naver-map`). WebView(JS API)나
   정적 이미지가 아니라 네이티브 Mobile SDK — 최상의 UX. 이미 카카오 때문에 dev client를
   쓰고 있어 네이티브 모듈 추가가 부담이 아니고, v2.9.0이 신아키텍처(Fabric `componentProvider`)를
   지원함을 확인했다.
3. **동선 선**: 직선 연결(순서대로 Polyline). Directions(실제 도로 경로) 아님 — 추가 API/과금
   없이 순서를 보여주는 데 충분하다.
4. **배치/모드**: 코스 섹션에 "지도로 보기" 버튼 → 전체화면 지도 화면.

## 사용자 흐름

트랙 상세(`track/[id]`) 코스 섹션 헤더 → `지도로 보기` 버튼(핀 가능 장소 ≥1일 때만 노출)
→ 전체화면 지도(`/track/[id]/map`).

지도:
- 코스 장소를 **순번 핀**으로 표시. 캡션은 `visit_time`이 있으면 `14:00`, 없으면 순번(`1`,`2`…) —
  코스 목록 행과 동일한 규칙(`track/[id]/index.tsx`의 `courseRow`).
- 순서대로 **직선 Polyline**으로 연결. 색은 `color.accent`.
- 카메라는 전체 핀이 다 보이게 자동 맞춤(bounds fit).
- 핀 탭 → 장소 상세(`/place/[id]`).
- 계획(plan)·발매(released) 트랙 모두 동작.

## 아키텍처

의존성 방향(`app/ → components/ → api/·lib/ → theme/·types/`)을 지킨다.

### 새 의존성 & 네이티브 설정

- `@mj-studio/react-native-naver-map` (v2.9.0)
- `app.config.ts`에 config plugin 주입 — **카카오와 동일 패턴**. NCP 클라이언트 ID는
  `.env`의 `NAVER_MAP_CLIENT_ID`에서 온다. 없으면 플러그인을 빼고 `console.warn`만(카카오와 동일).
  - 지도 클라이언트 ID는 시크릿이 아니다(앱 번들에 박히는 값, 카카오 네이티브 키와 같은 성격) —
    Edge Function 뒤로 숨길 필요 없음. "시크릿은 Edge Function 뒤로" 규칙의 예외.
- `expo-build-properties`(이미 설치)로 Android에 Naver Maven 저장소 주입.
- `.env.example`에 `NAVER_MAP_CLIENT_ID=` 추가.
- **네이티브 모듈이라 dev client 재빌드 필요.**

### 데이터 (`src/api/tracks.ts`)

- `useTrack` 쿼리의 `track_places(..., places(name, category, address, link))` →
  `places(name, category, address, link, lat, lng)`로 확장.
- `TrackPlace` 타입에 `lat: number | null`, `lng: number | null` 추가.
- 지도 화면은 별도 쿼리 없이 같은 `useTrack(id)` 캐시를 읽는다.

### 순수 로직 (`src/lib/map.ts`) — 유일한 단위 테스트 대상

React·Supabase·RN import 금지(lib/ 규칙).

- `pinnablePlaces(places)` — `lat`·`lng`가 둘 다 유효한 것만 남기고 `sortOrder` 순 정렬한
  좌표 목록 반환. 지도에 찍을 수 있는 장소만.
- `boundsOf(points)` — 핀들을 감싸는 카메라 영역(중심 좌표 + 위/경도 범위, 또는
  NaverMap `Region`/`Camera` 형태) 계산. 핀 1개면 그 점 중심의 기본 줌.

동선(직선 연결)은 `pinnablePlaces` 결과 순서 그대로 Polyline 좌표 배열로 넘긴다 — 별도 함수 불필요.

### 컴포넌트 / 화면

- **`src/app/track/[id]/map.tsx`** (신규 라우트, `gallery.tsx`·`player.tsx`와 형제)
  - `TopBar`(뒤로 가기, 제목 "코스 지도") + `NaverMapView` 풀스크린.
  - `Marker`(각 핀, caption=순번/시간, onTap → `router.push('/place/[id]')`).
  - `Polyline`(직선, `color.accent`).
  - 마운트 시 `boundsOf`로 카메라 초기 위치 설정.
  - 색·타이포는 전부 토큰(`color`, `typeface`). hex 하드코딩 금지.
- **`src/app/track/[id]/index.tsx`** 코스 섹션 헤더에 "지도로 보기" 버튼 추가.
  - `pinnablePlaces(t.places).length >= 1`일 때만 노출.
  - 탭 → `router.push('/track/[id]/map')`.

## 엣지 케이스

- 좌표(`lat`/`lng`) 없는 장소: 지도에서 제외(목록엔 그대로 표시). `pinnablePlaces`가 거른다.
- 핀 0개: "지도로 보기" 버튼 자체를 숨긴다.
- 핀 1개: 핀만 표시(Polyline 없음), 카메라는 그 점 중심.
- NCP 키 미설정: 플러그인이 빠져 지도 모듈이 없다 → dev 단계에선 버튼을 눌러도 지도가 안 뜰 수 있음.
  키 준비 후 재빌드가 전제(사전 준비물 참고).

## 검증 (goal-driven)

- `npm run typecheck` 통과.
- `npm test` — `src/lib/__tests__/map.test.ts`: `pinnablePlaces`(좌표 없는 것 제외·순서),
  `boundsOf`(2점/1점/다점의 중심·범위) 통과.
- 지도 렌더·핀·직선·카메라 맞춤·핀 탭 이동은 네이티브라 실기기 수동 확인
  (NCP 키 등록 + dev client 재빌드 후).

## 사전 준비물 (사용자 몫, 외부)

1. **NCP Maps 가입** → Mobile Dynamic Map 이용 신청, 클라이언트 ID 발급.
2. NCP 콘솔에 **Android 패키지명 `com.hyunwoo.dodori`** + **iOS 번들 ID `com.hyunwoo.dodori`** 등록.
3. `.env`에 `NAVER_MAP_CLIENT_ID` 넣고 dev client 재빌드(`npx expo run:android|ios`).
   EAS 빌드용으로도 `eas env:create`에 등록.

## 범위 밖 (YAGNI)

- 실제 도로 경로(Directions API).
- 플레이리스트/전용 지도 화면.
- 인라인(코스 섹션 안) 지도 미리보기.
- 현재 위치, 실시간 추적, 지도 위 사진 표시.

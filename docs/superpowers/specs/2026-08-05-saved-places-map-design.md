# 찜리스트 상세를 지도로 — 담은 곳을 핀으로 본다

2026-08-05

## 문제

`playlist/custom/[id]` 상세는 화면 상단 140px를 `PlaylistTile`(리스트 색 + 아이콘, 아이콘이 없으면
이름 첫 글자)이 차지한다. 이 타일은 라이브러리 탭 목록에서 리스트를 **구분**할 때는 쓸모가 있지만,
이미 그 리스트 안에 들어온 상세 화면에서는 정보량이 0이다. 화면에서 가장 큰 요소가 가장 안 쓸모없다.

찜리스트가 답해야 할 질문은 "이 리스트는 무슨 색인가"가 아니라 **"우리가 담아둔 곳들이 어디에 있나"**다.
장소를 모은 목록에 가장 잘 맞는 표현은 지도다.

## 결정

상세 화면을 **지도 전면 + 바텀시트 목록**으로 재구성한다 (네이버 지도 앱과 같은 형태).
지도가 주인공이고, 담은 곳은 핀으로 뜨고, 목록은 아래에서 끌어올린다.

```
┌─────────────────────┐
│ ‹  맛집 리스트   수정 │ ← TopBar 오버레이 (배경 없음, 지도 위)
│                     │
│    📍      📍       │
│         📍          │ ← 지도 (flex:1, 화면 전체)
│   📍         📍     │
│                     │
├━━━━━━━━━━━━━━━━━━━━━┤ ← BottomSheet (접힘 38% / 펼침 88%)
│        ▬▬▬          │
│ 장소 12곳            │
│ [◧] 성수 베이커리  › │
│ [◧] 연남 파스타    › │
│ + 장소 담기          │
└─────────────────────┘
```

찜(`kind='saved'`)과 커스텀 리스트가 같은 화면을 쓴다 — 지금과 같다.
조회 중에는 140px 타일이 사라진다. 리스트의 색·아이콘은 라이브러리 탭 목록의 44px 타일에서
계속 보이므로 정체성은 잃지 않는다.

### 왜 접근 방식을 이렇게 골랐나

- **상단 미니맵 + 목록 스크롤**을 먼저 검토했으나, 조작 가능한 지도를 `ScrollView` 안에 넣으면
  지도 안 세로 드래그와 페이지 스크롤이 싸운다. 지도를 정적 프리뷰로 만들면 충돌은 없어지지만
  "시각적으로 본다"는 목적이 반감된다
- **지도/목록 세그먼트 토글**은 화면이 둘로 늘고 탭을 하나 더 배워야 한다
- 지도 전면 + 시트는 이 문제의 표준 해법이고, 사용자가 이미 네이버 지도에서 학습한 형태다

## 컴포넌트 — 지도는 새로 만들지 않고 일반화한다

`TrackCourseMap`(코스 동선 지도)을 복제하지 않는다. 웹 구현(`TrackCourseMap.web.tsx`,
네이버 지도 v3 JS API 로더)이 100줄을 넘는데 복사하면 두 벌이 갈라져 유지보수가 무너진다.

`src/components/map/PlaceMap.tsx` + `PlaceMap.web.tsx`로 옮기고, 두 화면의 차이를 prop으로 흡수한다
(CLAUDE.md OCP 규칙 — 새 케이스는 컴포넌트 안에 if를 늘리지 말고 prop으로 받는다).

| prop | 코스 지도 | 찜 지도 |
|---|---|---|
| `showPath` | `true` (핀을 직선으로 연결) | `false` — 찜은 순서가 없다 |
| `pins[].label` | `"1"` / `"14:30"` | `undefined` — 번호 없는 민핀 |
| `selectedId` | `null` (미사용) | 선택된 핀 확대·강조 |

`TrackCourseMap.tsx` / `.web.tsx`는 삭제하고 `track/[id]/map.tsx`가 `PlaceMap`을 쓰게 바꾼다.
코스 지도의 동작은 달라지지 않는다.

`MapPin`의 `label`이 optional이 되므로, 라벨이 없으면 마커 SVG 안의 번호 `<Text>`를 그리지 않는다.

## 데이터

세 곳만 손댄다.

### `api/playlists.ts`

`usePlaylistDetail`의 select에 `lat, lng`를 추가하고 `PlaylistDetail['places']`에 두 필드를 넣는다.

```
places(id, name, category, address, link)
  → places(id, name, category, address, link, lat, lng)
```

좌표는 이미 채워져 있다 — `search-places` Edge Function이 네이버 카텍(`mapx`/`mapy`, ×1e7)을
WGS84로 변환해 반환하고, 장소를 담을 때 `places` 행에 그대로 저장된다. 다만 컬럼은 nullable이므로
없을 수 있다고 보고 다룬다.

### `lib/map.ts`

`pinnablePlaces`는 `Pinnable`에 `sortOrder`를 요구해서 찜 장소에 쓸 수 없다(찜은 순서가 없다).
순수 함수를 하나 뽑아낸다.

```ts
/** 좌표(lat·lng 둘 다 유효)가 있는 장소만. 정렬하지 않는다. */
export function withCoords<T extends { lat: number | null; lng: number | null }>(places: T[]): (T & LatLng)[]

/** 좌표 있는 장소만, sortOrder 오름차순으로 (코스용) */
export function pinnablePlaces<T extends Pinnable>(places: T[]): Pinned<T>[]
  → withCoords(places).sort((a, b) => a.sortOrder - b.sortOrder)
```

`lib/`는 이 프로젝트의 유일한 단위 테스트 대상이므로 **`withCoords` 테스트를 추가한다**
(좌표 둘 다 있음 / lat만 null / lng만 null / NaN / 빈 배열).
`pinnablePlaces`의 기존 테스트는 그대로 통과해야 한다 — 리팩토링이지 동작 변경이 아니다.

`boundsOf`는 손대지 않는다. 찜한 곳은 코스와 달리 전국구로 흩어질 수 있지만
이미 min/max를 감싸고 `MIN_SPAN`·`PADDING`을 적용하므로 자동으로 대응된다.

## 핀 ↔ 목록 동기화

화면이 `selectedId: string | null` 하나를 들고 지도와 시트 양쪽에 내려준다.

- **핀 탭** → `setSelectedId` + 시트를 접힘(index 0)으로 스냅 + `BottomSheetFlatList.scrollToIndex`로
  해당 행까지 스크롤 + 그 행 배경 강조
- **목록 행 탭** → `/place/[id]` 상세로 이동 (지금과 동일)
- **목록 스크롤은 카메라를 움직이지 않는다** — 스크롤할 때마다 지도가 따라 흔들리면 어지럽다.
  카메라 이동은 핀 탭에서만 일어난다

`BottomSheetScrollView`가 아니라 `BottomSheetFlatList`를 쓰는 이유는 `scrollToIndex`가 필요해서다.
`+ 장소 담기` 버튼은 `ListFooterComponent`로 붙인다.

## 수정 모드

`editing` state와 기존 편집 UI(`PlaylistLookFields`, 장소 `×` 버튼, 리스트 삭제)를
그대로 시트 안으로 옮긴다. 규칙은 지금과 같다 — 찜(`kind='saved'`)은 이름·색·아이콘을 바꿀 수 없고
리스트 삭제 진입점도 없다. 달라지는 것만:

- 수정 진입 시 **시트를 펼침(index 1)으로 고정하고 드래그를 잠근다** —
  편집 중 시트가 내려가 입력 필드가 가려지지 않게
- `PlaylistLookFields` 위에 **64px `PlaylistTile`** 미리보기를 둔다.
  색·아이콘을 고르는 동안 결과가 보여야 하는데, 조회 화면에서 140px 타일이 사라졌기 때문에
  이 미리보기가 없으면 무엇을 고르는지 알 수 없다
- 지도는 뒤에 그대로 둔다 — 편집 중에도 위치 맥락이 유지된다
- 수정 중에는 지금처럼 목록 행 탭으로 화면을 뜨지 않는다(`disabled={editing}`)

## 폴백 · 에러

- **좌표 있는 장소가 0곳**(빈 리스트 포함, 또는 담은 곳이 전부 좌표 없음) → `boundsOf`가 `null`.
  지도 자리에 `color.surface1` 배경 + "지도에 표시할 장소가 없어요".
  **시트는 이 경우에도 반드시 뜬다** — `+ 장소 담기`가 시트 안에 있으므로,
  빈 리스트에서 시트를 숨기면 장소를 담을 방법이 사라진다
- **좌표가 없는 개별 장소** → 핀은 안 찍히지만 목록에는 정상 노출된다. 목록 행에 "지도 없음" 같은
  표시는 하지 않는다 (네이버 검색으로 담은 곳은 사실상 항상 좌표가 있어, 있지도 않을 상태를 위한 UI다)
- **로딩 중**(`detail.isPending`) → 기존과 같이 빈 화면. 지도는 region이 정해진 뒤에만 마운트한다

## 웹

`@gorhom/bottom-sheet`는 웹을 지원하고 `PlaceMap.web.tsx`도 그대로 쓰이므로,
웹에서도 같은 화면이 나온다. 별도 분기를 만들지 않는다.

## 의존성

`@gorhom/bottom-sheet@^5.2.14` 추가.

| | 요구 | 우리 |
|---|---|---|
| `react-native-reanimated` | `>=3.16.0 \|\| >=4.0.0-` | 4.5.0 ✅ |
| `react-native-gesture-handler` | `>=2.16.1` | ~2.32.0 ✅ |

네이티브 모듈이 없는 순수 JS + reanimated worklet 패키지다 — config plugin도, prebuild 재실행도 필요 없다.

직접 구현도 검토했다. 2단 스냅 자체는 어렵지 않지만, 진짜 어려운 건
**내부 스크롤 ↔ 시트 드래그 핸드오프**다 — 목록을 아래로 당길 때 스크롤이 맨 위에 있으면 시트가 내려가고,
아니면 목록만 스크롤되는 동작. 직접 짜면 `simultaneousHandlers`와 스크롤 오프셋 워크렛 추적으로
계속 손이 가고 iOS/Android가 미묘하게 다르다. `BottomSheetFlatList`가 정확히 이 문제를 푸는 컴포넌트다.

기존 시트들(`PlaceSearchSheet` 등)은 전부 고정 높이 `Modal`이라 패턴이 갈리지만,
그것들은 "떴다 닫히는 모달"이고 이건 "화면에 상주하는 패널"이라 원래 다른 물건이다.

## 검증

- `npm test` — `withCoords` 새 테스트 통과, `pinnablePlaces` 기존 테스트 그대로 통과
- `npm run typecheck` — strict 통과
- 실기기(dev client)에서:
  - 찜리스트를 열면 담은 곳이 전부 핀으로 보이고 카메라가 그것들을 담는다
  - 핀을 탭하면 시트가 접히며 해당 행으로 스크롤·강조된다
  - 시트를 끝까지 펼친 뒤 목록을 아래로 당기면 시트가 다시 접힌다(핸드오프)
  - "수정"에서 색·아이콘을 바꾸면 64px 미리보기가 따라 바뀌고, "완료"로 저장된다
  - 빈 리스트에서 "지도에 표시할 장소가 없어요"가 뜨고 `+ 장소 담기`는 여전히 눌린다
  - 코스 지도(`/track/[id]/map`)가 리팩토링 전과 똑같이 동작한다(번호 핀 + 연결선)

## 범위 밖

- 지도에서 장소를 직접 담기(지도 롱탭 → 검색) — 담기는 기존 `modals/place-search` 그대로
- 현재 위치 표시·주변 검색
- 핀 클러스터링 — 찜 목록 규모(수십 곳)에서는 필요 없다
- 카테고리별 핀 색 구분 — 색으로 종류를 나누는 건 별건이다. 지금은 전부 `color.accent`

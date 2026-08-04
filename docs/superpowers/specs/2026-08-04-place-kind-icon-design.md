# 장소 분류 아이콘 — 코스 리스트의 순번을 아이콘 타일로

2026-08-04

## 문제

데이트 코스 리스트는 장소를 이름 + 네이버 분류 원문 텍스트로만 보여준다.
훑어볼 때 "밥 → 카페 → 전시"라는 하루의 흐름이 한눈에 안 읽힌다.
왼쪽 42px 칼럼이 쓰는 **순번 숫자는 정보가 없다** — 위에서 아래로 놓인 순서를 보면 이미 안다.

장소 분류는 이미 갖고 있다. 네이버 지역검색이 `category`를 주고(`음식점>한식>육류,고기`),
`search-places`가 그대로 통과시키고, `places.category`에 저장된다. **DB 변경 없음.**

## 설계

### 1. `src/lib/placeKind.ts` — 순수 함수

```ts
export type PlaceKind = 'food' | 'cafe' | 'bar' | 'culture' | 'nature' | 'shopping' | 'stay' | 'etc';
export function placeKind(category: string | null | undefined): PlaceKind;
export function placeKindLabel(kind: PlaceKind): string;
```

네이버 원문 문자열을 키워드로 매칭한다. **구체적인 것부터 본다** — `술집·주점·바`를
`음식점`보다 먼저 검사해야 술집이 '음식'으로 빠지지 않는다. `카페,디저트`도 마찬가지로
`음식점`보다 앞. 매칭 실패는 `etc`.

8종: 음식 · 카페 · 술 · 문화 · 자연 · 쇼핑 · 숙박 · 장소(기타).

lib 규칙대로 React·Supabase·RN import 없음. `src/lib/__tests__/placeKind.test.ts`에
실제 네이버 응답 문자열 표본으로 케이스를 고정한다(술집이 음식으로 안 빠지는 것, 빈 문자열·null → etc 포함).

### 2. 글리프 7개 — `src/components/glyphs.tsx`

`FoodGlyph`(포크·나이프) / `CafeGlyph`(컵) / `BarGlyph`(칵테일잔) / `CultureGlyph`(액자) /
`NatureGlyph`(나무) / `ShoppingGlyph`(쇼핑백) / `StayGlyph`(침대).
`etc`는 이미 있는 `PinGlyph`를 재사용한다 — 8번째 글리프를 새로 그리지 않는다.

기존 글리프와 같은 규격: 24×24 viewBox, `strokeWidth={1.7}`, `strokeLinecap="round"`,
`{ size, color }` props, 새 의존성 없음(react-native-svg는 이미 씀).

### 3. `src/components/PlaceKindTile.tsx` — props-only

```ts
{ category: string | null; size?: number }   // size 기본 36
```

둥근 네모(`radius.field`) + `color.surface2` 배경 + 글리프 `color.sub`.
내부에서 `placeKind()`만 호출하고 네트워크·전역상태를 만지지 않는다.

**타일은 단색이다.** 종류별 8색을 새로 만들면 토큰이 늘고, 일정색 6색 · 기념일 amber ·
데이트 아쿠아와 한 화면에서 섞여 색이 무엇을 뜻하는지 못 읽게 된다.
구분은 글리프 모양이 한다.

### 4. 코스 행 — `src/app/track/[id]/index.tsx` `courseRow`

```
┌────────────────────────────────────────┐
│ ▢  알베르 커피                13:00  ≡ │
│    카페,디저트>카페                    │
│ ▢  국립현대미술관                    ≡ │
│    문화,예술>미술관                    │
└────────────────────────────────────────┘
```

- 왼쪽 42px 칼럼(순번/시간)과 그 옆 세로 구분선을 **`PlaceKindTile`로 교체**. 순번 숫자는 삭제.
- `visitTime`은 오른쪽 끝, 그립·삭제 버튼 왼쪽에 우측정렬. 발매된 트랙이면 지금처럼 `color.accent`,
  아니면 `color.sub`. 시간이 없으면 아무것도 안 그린다.
- 이름 아래 메타 줄은 **네이버 원문 그대로 유지** — 아이콘이 대분류를, 텍스트가 세부를 맡는다.
- `COURSE_ROW_H = 62` 유지 → `DraggableCourseList`의 행 높이 계산에 영향 없음.

### 5. 수정모드 컨트롤 크기 (모바일에서 확인된 문제)

지금 그립 `≡`은 `fontSize: 17` 텍스트, 삭제 `×`는 `fontSize: 16` + `hitSlop 8`(실질 ~32px)이라
손가락으로 짚기 어렵다.

- 그립: 텍스트 `≡` → `GripGlyph`(가로 3줄 SVG, 20px)를 **44×44** 컨테이너에 담는다.
  행 전체가 드래그 대상이므로 그립 자체는 시각 힌트지만, 눈에 띄는 크기여야 "끌 수 있다"가 읽힌다.
- 삭제: `×` → `CloseGlyph`(SVG, 18px)를 **44×44 Pressable**로. 커진 실제 크기가 터치 영역이 되므로
  `hitSlop`은 뺀다.
- 색은 둘 다 `color.muted` → `color.sub`. muted는 #121212 위에서 거의 안 보인다.

44는 행 높이 62 안에 들어가고, 둘 다 켜져도 오른쪽 88px — 이름 줄 폭은 여전히 충분하다.

### 6. 장소 검색 결과

`src/components/PlaceSearchSheet.tsx`와 `src/app/modals/place-search.tsx`의 검색 결과 행 앞에
같은 타일을 28px로 붙인다. 두 곳 다 `SearchPlace.category`를 이미 들고 있어 API 변경 없음.

## 범위 밖

- `CourseCardStrip` · `TrackCourseMap` 마커 · 찜 목록 · 커스텀 플레이리스트 — 다음에.
- `places.category` 스키마 변경, 분류 키를 DB에 저장하기 — 원문에서 매번 파생하면 충분하다.

## 검증

- `npm test` — `placeKind` 표본 케이스 통과
- `npm run typecheck`
- 실기기: 코스 리스트에서 종류별 아이콘 확인, 수정모드에서 그립·삭제를 한 번에 짚히는지 확인

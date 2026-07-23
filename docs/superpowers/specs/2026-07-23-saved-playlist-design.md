# 찜 — 기본 플레이리스트와 데이트 계획의 연결

날짜: 2026-07-23
상태: 설계 확정 (구현 전)

## 문제

플레이리스트 탭의 정체성이 여전히 모호하다. `2026-07-13-playlist-album-track-design.md`가 같은 진단을 내렸지만
그중 앨범 캐러셀만 구현됐고 핵심인 **계획 → 실행의 다리**는 놓이지 않았다.

구체적으로 `src/app/modals/place-search.tsx`는 이름이 "장소 담기"인데 네이버 검색만 있다.
데이트에 장소를 담으려면 매번 처음부터 검색해야 하고, 플레이리스트에 쟁여둔 곳을 꺼낼 방법이 없다.
그래서 플리는 "만들 수 있고 볼 수만 있는" 목록으로 남았다 — 저장하는 행위에 목적이 없다.

## 결정

### 찜 = 커플당 하나씩 자동으로 존재하는 기본 플레이리스트

`playlists.kind`에 `'saved'`를 추가한다. 커플마다 정확히 하나 존재하며:

- 이름 "찜", 플리 목록 맨 위 고정
- 삭제·이름변경 불가 (UI에 진입점을 두지 않는다)
- 장소를 저장할 때 특별한 의도가 없으면 여기로 간다
- 테마 플리("여름 데이트", "비 오는 날")는 그 위에 얹는 선택지

기존 `playlists` / `playlist_places`를 그대로 쓴다. 조회·추가·삭제 훅도 이미 있는 것을 재사용한다.

### 찜은 커플 공용이다

`2026-07-13` 스펙의 **`place_likes`(개인별 ♡ + 매칭 배지) 안은 폐기한다.**

이유: 커플 앱에서 "가고 싶은 곳"은 어차피 합의 대상이다. 개인별로 나누면 저장할 때마다
"이건 내 거야 우리 거야"를 판단해야 해서 마찰이 생기고, 매칭 배지는 그 마찰을 감수할 만큼의 값을 주지 않는다.
새 테이블·RLS·매칭 순수 함수가 전부 불필요해지는 것도 이 결정의 이득이다.

앨범 ♡(`tracks.liked`)는 다른 축이므로 그대로 둔다.

## 스키마 (마이그레이션 1개)

`supabase/migrations/20260723000001_saved_playlist.sql`

기존 스키마가 이미 이 확장을 예상하고 있었다 — `20260708000001_schema_v1.sql:147`은
`kind text not null default 'custom' check (kind = 'custom')`으로, 컬럼은 있고 값만 막혀 있다.

1. **check 완화** — `check (kind in ('custom', 'saved'))`
2. **커플당 찜 하나** — `create unique index playlists_saved_unique on public.playlists (couple_id) where kind = 'saved';`
   부분 유니크 인덱스가 트리거의 멱등성을 보장한다.
3. **기존 커플 백필** — 각 커플의 아무 멤버나 `created_by`로 삼아 찜 1행 insert.
   `on conflict do nothing`으로 재실행 안전.
4. **신규 커플 자동 생성 트리거** — `couple_members` insert after 트리거.
   `couples`가 아니라 `couple_members`에 거는 이유: `playlists.created_by`가 `not null references auth.users`라
   멤버가 있어야 채울 수 있다. 두 번째 멤버가 들어와도 2번의 유니크 인덱스가 중복을 막는다.

RLS는 기존 `playlists` 정책을 그대로 탄다 — 별도 정책 추가 없음.

마이그레이션 후 `npx supabase gen types typescript --local > src/types/database.types.ts` 재생성.

## 화면

### 장소 담기 모달 (`src/app/modals/place-search.tsx`)

소스 세그먼트 2개를 붙인다.

```
[ 찜한 곳 ]  [ 검색 ]
```

- **데이트에서 진입**(`trackId` 있음) → **찜한 곳**이 기본 세그먼트. 이게 이 스펙의 핵심 동선이다
- **플리에 담으러 진입**(`playlistId`) → **검색**이 기본. 찜에서 찜으로 담는 것은 의미가 없다
- 찜한 곳 세그먼트는 찜 플리를 맨 위에, 테마 플리들을 그 아래 그룹으로 표시
- 이미 이 데이트 코스에 담긴 장소는 `✓`로 비활성 — 현재 검색 결과 행의 `added` 처리를 그대로 재사용

### 플레이리스트 탭 (`src/app/(tabs)/playlist/index.tsx`)

"테마 플레이리스트" 목록 맨 위에 찜을 고정한다. 삭제 진입점 없음.

## 영향 범위

의존성 방향(`app/ → components/ → api/·lib/`)을 지킨다.

- **api/** — `api/playlists.ts`에 `useSavedPlaces()` 추가: 모든 플리의 장소를 플리 이름과 함께 평탄화 조회.
  `usePlaylists()`는 `kind`를 함께 반환하도록 확장(찜을 맨 위로 정렬·삭제 숨김 판단에 필요)
- **api/** — `api/places.ts`에 저장된 장소를 코스에 꽂는 경로 추가. 기존 `useAddTrackPlace`는
  `SearchPlace`를 `upsert`하는데, 찜한 장소는 이미 `places.id`가 있으므로 upsert 없이
  `track_places`에 바로 insert한다
- **app/** — `place-search.tsx` 세그먼트화, `playlist/index.tsx` 찜 고정
- **lib/** — 없음. 이 스펙에는 순수 도메인 규칙이 없다 (정렬은 SQL, 나머지는 표현)

`playlist_items`(장소+앨범 혼합) 다형 항목은 이 스펙 범위 밖이다 — 기존 `playlist_places`를 유지한다.

## 검증

1. `npm run typecheck`
2. `npx supabase db reset` — 마이그레이션 적용, 백필·트리거 동작 확인
3. 실제 앱으로 한 바퀴: **검색해서 찜에 저장 → 데이트 만들기 → 장소 담기에서 찜 세그먼트로 그 장소 선택 → 코스에 꽂힘**

3번이 이 스펙의 성공 기준이다. 이 흐름이 자연스러우면 플리 탭에 목적이 생긴 것이다.

## 열린 항목 (이 스펙 밖)

- 플리 탭이 계획(찜·테마 플리)과 회상(앨범 캐러셀·월별 아카이브)을 한 화면에 쌓고 있고,
  회상은 피드 탭과도 겹친다. 이 다리를 놓은 뒤 탭 경계를 다시 본다
- `playlist/index.tsx`의 `contentContainerStyle` `paddingBottom: 32`가 탭바(56)와 FAB를 감안하지 않아
  목록 마지막 항목이 가려진다

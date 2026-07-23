# 찜 — 장소 찜과 다음 데이트 추천

날짜: 2026-07-23
상태: 설계 확정 (구현 전)
개정: 2026-07-23 — 찜 대상을 장소로 못박고, 앨범 ♡ 폐기·플레이리스트 화면 재구성을 포함

## 문제

플레이리스트 탭의 정체성이 모호하다. `2026-07-13-playlist-album-track-design.md`가 같은 진단을 내렸지만
그중 앨범 캐러셀만 구현됐고 핵심인 **계획 → 실행의 다리**는 놓이지 않았다.

1. `src/app/modals/place-search.tsx`는 이름이 "장소 담기"인데 네이버 검색만 있다. 데이트에 장소를 담으려면
   매번 처음부터 검색해야 하고, 쟁여둔 곳을 꺼낼 방법이 없다. 저장하는 행위에 목적이 없다.
2. 화면이 계획(테마 플리)과 회상(앨범 캐러셀·월별 아카이브)을 한 스크롤에 쌓아 중구난방으로 읽힌다.
3. 하트가 두 뜻으로 쓰인다 — 앨범 ♡(`tracks.liked`)는 "아껴둔다"(회상), 장소 찜은 "가보고 싶다"(계획).

## 결정

### 찜의 대상은 장소다

**찜 = 커플당 하나씩 자동으로 존재하는 기본 플레이리스트.** 담기는 항목은 장소(`places`)뿐이다.

- 이름 "찜", 플리 목록 맨 위 고정, 삭제·이름변경 불가
- 장소가 보이는 모든 곳(검색 결과, 장소 상세, 코스)에 하트 하나 → 누르면 찜에 쌓인다
- 테마 플리("여름 데이트", "비 오는 날")는 그 위에 얹는 선택지

기존 `playlists` / `playlist_places`를 그대로 쓴다. 조회·추가·삭제 훅도 이미 있는 것을 재사용한다.

### 찜은 커플 공용이다

`2026-07-13` 스펙의 **`place_likes`(개인별 ♡ + 매칭 배지) 안은 폐기한다.**

커플 앱에서 "가고 싶은 곳"은 어차피 합의 대상이다. 개인별로 나누면 저장할 때마다
"이건 내 거야 우리 거야"를 판단해야 해서 마찰이 생기고, 매칭 배지는 그 마찰을 감수할 만큼의 값을 주지 않는다.
새 테이블·RLS·매칭 순수 함수가 전부 불필요해지는 것도 이 결정의 이득이다.

### 앨범 ♡는 폐기한다

하트가 화면에 따라 다른 뜻이 되는 것이 모호함의 원인이다. **찜은 장소 하나에만 쓴다.**
"아껴둔 앨범"은 회상인데 회상은 피드 탭의 일이고, 피드에는 이미 게시물 좋아요(`post_reactions`)가 따로 있다.

제거 대상:
- `tracks.liked` 컬럼
- `src/app/(tabs)/feed/favorites.tsx` 화면
- `src/app/(tabs)/feed/settings.tsx`의 "아껴둔 앨범 N" 진입점
- `src/app/track/[id]/index.tsx`의 `♥/♡` 버튼
- `src/api/tracks.ts`의 `liked` 필드·패치 경로

## 스키마 (마이그레이션 1개)

`supabase/migrations/20260723000002_saved_playlist.sql`
(`20260723000001`은 대댓글 작업이 선점했다.)

기존 스키마가 이미 이 확장을 예상하고 있었다 — `20260708000001_schema_v1.sql:147`은
`kind text not null default 'custom' check (kind = 'custom')`으로, 컬럼은 있고 값만 막혀 있다.

1. **check 완화** — `check (kind in ('custom', 'saved'))`
2. **커플당 찜 하나** — `create unique index playlists_saved_unique on public.playlists (couple_id) where kind = 'saved';`
   부분 유니크 인덱스가 트리거의 멱등성을 보장한다.
3. **기존 커플 백필** — 각 커플의 아무 멤버나 `created_by`로 삼아 찜 1행 insert. `on conflict do nothing`.
4. **신규 커플 자동 생성 트리거** — `couple_members` insert after 트리거.
   `couples`가 아니라 `couple_members`에 거는 이유: `playlists.created_by`가 `not null references auth.users`라
   멤버가 있어야 채울 수 있다. 두 번째 멤버가 들어와도 2번의 유니크 인덱스가 중복을 막는다.
5. **`alter table public.tracks drop column liked;`**

RLS는 기존 `playlists` 정책을 그대로 탄다 — 별도 정책 추가 없음.
마이그레이션 후 `npx supabase gen types typescript --local > src/types/database.types.ts` 재생성.

## 화면

### 플레이리스트 탭 (`src/app/(tabs)/playlist/index.tsx`)

세 덩어리로 재구성한다. 계획이 주인공이고, 회상은 캐러셀 하나로 압축한다.

```
1. 앨범 캐러셀            ← 메인. 가운데가 현재, 좌=지난 데이트 / 우=다가오는 데이트
2. "○/○ 데이트에 담을 곳"  ← 찜한 장소 중 추천. 다가오는 데이트가 있을 때만
3. 찜한 장소 · 테마 플레이리스트
```

**월별 아카이브 목록은 제거한다.** 캐러셀이 지난 데이트를 이미 좌측에 담고 있어 중복이고,
본격적인 회상은 피드 탭의 일이다.

**2번(추천)이 이 스펙의 핵심 화면이다.** 다가오는 데이트가 있으면 그 날짜를 헤더에 걸고
찜한 장소를 가로 카드로 늘어놓는다. 카드의 담기 버튼을 누르면 그 데이트 코스에 바로 꽂힌다 —
플리 탭에서 캘린더를 거치지 않고 계획이 완성된다.

다가오는 데이트가 없으면 2번은 통째로 숨기고, 3번의 찜 목록이 바로 이어진다.

### 추천 규칙

순수 함수 `src/lib/recommend.ts`에 둔다. 알고리즘을 발명하지 않는다 — 필터 + 정렬이 전부다.

- 대상: 찜 플리의 장소
- 제외: 그 데이트 코스에 이미 담긴 장소, 이미 다녀온 장소(`track_places`에 과거 기록 있음)
- 정렬: 최근 찜한 순
- 상한: 10곳

`now`/오늘 날짜는 파라미터로 주입한다(mock 금지). 이 스펙의 유일한 단위 테스트 대상이다.

### 데이트 만들기 (`src/app/modals/create-track.tsx`)

순서를 뒤집는다. **앨범을 먼저 만들고, 장소는 그 아래에 채운다.**

```
데이트 만들기 (모달)          →  앨범 생성  →  track/[id] 상세
  · 날짜                                        · 제목 (수정)
  · 제목                                        · 코스에 장소 추가
```

현재는 2단계 위저드(1. 날짜 → 2. 장소 담기)이고 앨범 행은 마지막 "완료"에서야 생성된다.
제목 입력 단계는 없어서 `useCreateTrack`이 받을 수 있는 `title`이 안 넘어가고 전부 `'Untitled'`가 된다.
이 순서가 부작용 셋을 만들었다:

1. **아키텍처 규칙 위반** — `trackId`가 마지막에 생기니 훅을 못 쓰고, 화면(`create-track.tsx:40-51`)에서
   `supabase`를 직접 import해 수동 insert 루프를 돈다. "Supabase 접근은 api/로만"에 어긋난다
2. **부분 실패 무방비** — 장소 5개 중 3번째에서 실패하면 앨범은 생성됐고 장소는 2개만 들어간 채로 끝난다
3. **장소 담기 UI 이중화** — step 2와 `place-search.tsx`가 거의 같은 화면을 각각 구현하고 있다

바꾸면 셋이 함께 정리된다. `create-track.tsx`는 **날짜 + 제목만 받고 `track/[id]`로 보내는 폼**이 되고,
저장은 `useCreateTrack` 한 번으로 끝난다. step 2(`PickPlaces`)와 `finish()`의 수동 루프는 삭제한다.

앨범 상세의 장소 추가는 새로 만들 것이 없다 — `track/[id]/index.tsx:369`가 이미 `trackId`와 함께
`place-search` 모달을 연다. 장소 담기 UI가 하나로 줄어들어 아래 찜 세그먼트도 한 곳에만 붙이면 된다.

**받아들이는 트레이드오프**: 앨범이 즉시 생성되므로 만들다 말면 장소 없는 빈 앨범이 남는다.
"날짜만 잡아두고 나중에 채운다"는 실제 계획 방식에 가깝고 캘린더에도 다가오는 데이트로 바로 뜨므로,
빈 앨범을 정리하는 장치는 두지 않는다.

### 장소 담기 모달 (`src/app/modals/place-search.tsx`)

소스 세그먼트 2개를 붙인다.

```
[ 찜한 곳 ]  [ 검색 ]
```

- **데이트에서 진입**(`trackId` 있음) → **찜한 곳**이 기본 세그먼트
- **플리에 담으러 진입**(`playlistId`) → **검색**이 기본. 찜에서 찜으로 담는 것은 의미가 없다
- 찜한 곳 세그먼트는 찜 플리를 맨 위에, 테마 플리들을 그 아래 그룹으로 표시
- 이미 이 데이트 코스에 담긴 장소는 `✓`로 비활성 — 현재 검색 결과 행의 `added` 처리를 재사용

### 장소 썸네일

네이버 지역검색 API는 이미지를 주지 않는다(`title/link/category/address/roadAddress/mapx/mapy`가 전부).
외부 이미지 API는 도입하지 않는다 — 장소명으로 검색하는 방식이라 엉뚱한 사진이 섞이고 저작권도 애매하다.

- **가본 곳** — 그 장소가 속한 데이트의 사진. `api/playlists.ts`의 `visitStats()`가 이미 뽑고 있다
- **안 가본 곳** — `AlbumJacket` + `coverPalette` 방식의 생성 자켓(장소 id로 결정적 배정)

찜 목록은 대부분 안 가본 곳이므로 실제로는 자켓이 주로 보인다.

## 영향 범위

의존성 방향(`app/ → components/ → api/·lib/`)을 지킨다.

- **lib/** — `lib/recommend.ts` 신규(순수, 테스트 대상)
- **api/** — `api/playlists.ts`에 `useSavedPlaces()` 추가(모든 플리의 장소를 플리 이름과 함께 평탄화 조회).
  `usePlaylists()`는 `kind`를 함께 반환하도록 확장(찜 정렬·삭제 숨김 판단에 필요)
- **api/** — `api/places.ts`에 저장된 장소를 코스에 꽂는 경로 추가. 기존 `useAddTrackPlace`는
  `SearchPlace`를 `upsert`하는데, 찜한 장소는 이미 `places.id`가 있으므로 upsert 없이
  `track_places`에 바로 insert한다
- **api/** — `api/tracks.ts`에서 `liked` 제거
- **components/** — 장소 카드(썸네일 + 하트 + 담기), 하트 버튼
- **app/** — `playlist/index.tsx` 재구성, `create-track.tsx` 날짜+제목 폼으로 축소(step 2 삭제),
  `place-search.tsx` 세그먼트화, `favorites.tsx` 삭제, `track/[id]` ♥ 제거,
  `feed/settings.tsx` 진입점 제거

`playlist_items`(장소+앨범 혼합) 다형 항목은 이 스펙 범위 밖이다 — `playlist_places`를 유지한다.

## 검증

1. `npm test` — `lib/recommend.ts` 필터·정렬 테스트 통과
2. `npm run typecheck`
3. `npx supabase db reset` — 마이그레이션 적용, 백필·트리거 동작 확인
4. 실제 앱으로 한 바퀴: **검색해서 장소 찜 → 다가오는 데이트 만들기(날짜+제목) → 플리 탭 추천 섹션에서
   그 장소를 데이트에 담기 → 코스에 꽂힘**

4번이 이 스펙의 성공 기준이다. 이 흐름이 자연스러우면 플리 탭에 목적이 생긴 것이다.

`create-track.tsx`에서 화면이 `supabase`를 직접 import하는 곳이 사라졌는지도 함께 확인한다
(`grep -rn "from '@/api/supabase'" src/app src/components` → 결과 없음).

## 열린 항목 (이 스펙 밖)

- `playlist/index.tsx`의 `contentContainerStyle` `paddingBottom: 32`가 탭바(56)와 FAB를 감안하지 않아
  목록 마지막 항목이 가려진다
- 월별 아카이브를 플리 탭에서 걷어낸 뒤, 피드 탭이 회상을 온전히 받는지 다시 본다

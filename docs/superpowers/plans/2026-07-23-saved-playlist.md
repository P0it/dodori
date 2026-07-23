# 찜 — 장소 찜과 다음 데이트 추천 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 장소를 찜해두고, 다가오는 데이트에 그 찜한 장소를 바로 담을 수 있게 한다 — 플레이리스트 탭에 "계획 도구"라는 목적을 준다.

**Architecture:** 새 테이블을 만들지 않는다. 기존 `playlists.kind`에 `'saved'`를 열어 커플당 하나의 "찜" 플레이리스트를 DB 트리거로 보장하고, 담기·빼기는 이미 있는 `playlist_places` 훅을 재사용한다. 추천은 순수 함수 `lib/recommend.ts`(필터+정렬)로 두고, 화면은 조합만 한다. 하트가 두 뜻으로 갈리지 않도록 앨범 ♡(`tracks.liked`)는 제거한다.

**Tech Stack:** Expo SDK 57 / RN 0.86 / TS strict / expo-router / Supabase(Postgres·RLS·트리거) / TanStack Query / Jest(jest-expo).

이 플랜은 `docs/superpowers/specs/2026-07-23-saved-playlist-design.md`를 구현한다.

## Global Constraints

- **모든 색상은 `@/theme/tokens` 참조** — hex 하드코딩 금지. 3역할 키: `role.me`(나=green `#1ED760`) / `role.partner`(상대=pink `#E8688F`) / `role.anniv`(기념일=amber `#E8B84B`). 장소·데이트는 `color.date`(`#A78BFA`), 반투명 배경은 `roleBg.*`.
- **모든 텍스트는 `fontFamily: typeface`(= `'Pretendard'`) + 명시적 `fontWeight`.**
- **`lib/`는 순수 함수만** — React·RN·Supabase·Expo import 금지. 콜로케이트 테스트 `src/lib/__tests__/<name>.test.ts`, `now`/`today`는 파라미터 주입(mock 금지), `describe`/`it` 한글 라벨.
- **Supabase 접근은 `api/`로만** — 화면·컴포넌트에서 `supabase` 직접 import 금지. 이 플랜은 그 위반을 하나 제거한다(`create-track.tsx`).
- **날짜는 `'YYYY-MM-DD'` 문자열**, KST 연산은 `@/lib/date` 경유. `new Date()` 직접 비교 금지.
- import는 `@/` alias(`@/theme/tokens`, `@/lib/...`, `@/components/...`, `@/api/...`); `api/` 내부끼리는 상대경로(`./supabase`).
- 마이그레이션 파일명 `<YYYYMMDD><6자리>_<snake>.sql`. 현재 최신은 `20260723000001_post_comment_replies.sql` → 신규는 `20260723000002`.
- 검증 명령: `npm test`, `npm run typecheck`.
- **선행 조건:** Task 1의 `npx supabase db reset`은 Docker가 필요하다. 현재 이 머신에서 Docker가 꺼져 있다 — 시작하지 못하면 원격에 `npx supabase db push`로 적용하고, 타입은 `npx supabase gen types typescript --project-id iyqttrufrjeytntinsrb`로 뽑는다.

---

## File Structure

- **Create** `supabase/migrations/20260723000002_saved_playlist.sql` — `kind='saved'` 허용, 커플당 1개 유니크 인덱스, 백필, 자동 생성 트리거, `tracks.liked` 드롭.
- **Modify** `src/types/database.types.ts` — 재생성 결과 반영.
- **Create** `src/lib/recommend.ts` — `recommendPlaces` (순수).
- **Create** `src/lib/__tests__/recommend.test.ts` — 위 함수 테스트.
- **Modify** `src/api/playlists.ts` — `kind` 노출, `useSavedPlaylistId`, `useToggleSavedPlace`, `useSavedPlaces`.
- **Modify** `src/api/places.ts` — `useAddSavedPlaceToTrack`(upsert 없이 `place_id`로 코스에 삽입).
- **Modify** `src/api/tracks.ts` — `liked` 제거.
- **Delete** `src/app/(tabs)/feed/favorites.tsx`.
- **Modify** `src/app/(tabs)/feed/settings.tsx` — Favorites 진입점 제거.
- **Modify** `src/app/track/[id]/index.tsx` — ♥ 버튼 제거.
- **Create** `src/components/SavedHeart.tsx` — 장소 찜 토글 하트(props-only).
- **Create** `src/components/PlaceThumb.tsx` — 장소 썸네일(사진 있으면 사진, 없으면 생성 자켓).
- **Modify** `src/app/modals/create-track.tsx` — 날짜+제목 폼으로 축소, step 2 삭제.
- **Modify** `src/app/modals/place-search.tsx` — `[찜한 곳] [검색]` 세그먼트.
- **Create** `src/components/playlist/RecommendStrip.tsx` — 다음 데이트 장소 추천 가로 스트립.
- **Modify** `src/app/(tabs)/playlist/index.tsx` — 재구성, 월별 아카이브 제거.
- **Delete** `src/app/(tabs)/playlist/[month].tsx` — 아카이브 제거로 진입점이 사라진다.

---

### Task 1: 마이그레이션 — 찜 플레이리스트 + `tracks.liked` 제거

**Files:**
- Create: `supabase/migrations/20260723000002_saved_playlist.sql`
- Modify: `src/types/database.types.ts`

**Interfaces:**
- Produces: `playlists.kind`가 `'custom' | 'saved'`. 커플당 `kind='saved'` 행 정확히 1개(이름 `'찜'`). `tracks` 테이블에 `liked` 컬럼 없음.

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- 찜 — 커플당 하나씩 자동으로 존재하는 기본 플레이리스트(장소 전용).
-- 새 테이블을 만들지 않고 기존 playlists.kind를 연다. schema_v1이 kind 컬럼을 이미 두고
-- check로 'custom'만 막아둔 상태였다.
alter table public.playlists drop constraint playlists_kind_check;
alter table public.playlists add constraint playlists_kind_check
  check (kind in ('custom', 'saved'));

-- 커플당 찜은 정확히 하나. 부분 유니크 인덱스가 아래 트리거의 멱등성을 보장한다.
create unique index playlists_saved_unique
  on public.playlists (couple_id) where kind = 'saved';

-- 기존 커플 백필 — 가장 먼저 합류한 멤버를 created_by로.
insert into public.playlists (couple_id, kind, name, created_by)
select distinct on (cm.couple_id) cm.couple_id, 'saved', '찜', cm.user_id
from public.couple_members cm
order by cm.couple_id, cm.joined_at
on conflict do nothing;

-- 신규 커플 자동 생성. couples가 아니라 couple_members에 거는 이유:
-- playlists.created_by가 not null references auth.users라 멤버가 있어야 채울 수 있다.
-- 두 번째 멤버가 들어와도 위 유니크 인덱스가 중복을 막는다.
create or replace function public.ensure_saved_playlist()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.playlists (couple_id, kind, name, created_by)
  values (new.couple_id, 'saved', '찜', new.user_id)
  on conflict do nothing;
  return new;
end;
$$;

create trigger couple_members_ensure_saved_playlist
  after insert on public.couple_members
  for each row execute function public.ensure_saved_playlist();

-- 앨범 ♡ 폐기 — 하트는 장소 하나에만 쓴다. 회상은 피드 탭의 일.
alter table public.tracks drop column liked;
```

- [ ] **Step 2: 로컬 스택에 적용**

Run: `npx supabase db reset`
Expected: 에러 없이 전체 마이그레이션 적용.
Docker가 없으면: `npx supabase db push` (원격 적용, 되돌리기 어려우니 실행 전 사용자 확인).

- [ ] **Step 3: 백필·트리거 동작 확인**

Run:
```bash
npx supabase db reset && npx supabase gen types typescript --local > /dev/null && echo OK
```
그리고 SQL로:
```sql
select couple_id, count(*) from public.playlists where kind = 'saved' group by couple_id;
```
Expected: 커플마다 정확히 1행.

- [ ] **Step 4: 타입 재생성**

Run: `npx supabase gen types typescript --local > src/types/database.types.ts`
Expected: `playlists`에 `kind` 유지, `tracks` Row에서 `liked` 사라짐.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260723000002_saved_playlist.sql src/types/database.types.ts
git commit -m "feat(db): 찜 기본 플레이리스트 + tracks.liked 제거"
```

---

### Task 2: `lib/recommend.ts` — 추천 규칙 (순수)

**Files:**
- Create: `src/lib/recommend.ts`
- Test: `src/lib/__tests__/recommend.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface RecommendCandidate { placeId: string; savedAt: string }
  export function recommendPlaces<T extends RecommendCandidate>(
    candidates: T[],
    opts: { inCourse: string[]; visited: string[]; limit?: number },
  ): T[]
  ```
  찜한 장소 중 **그 데이트 코스에 이미 담긴 것**과 **이미 다녀온 것**을 빼고, 최근 찜한 순으로 최대 `limit`개(기본 10).

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
import { recommendPlaces } from '../recommend';

describe('recommendPlaces (다음 데이트 장소 추천)', () => {
  const saved = [
    { placeId: 'a', savedAt: '2026-07-01T00:00:00Z' },
    { placeId: 'b', savedAt: '2026-07-10T00:00:00Z' },
    { placeId: 'c', savedAt: '2026-07-05T00:00:00Z' },
  ];

  it('최근 찜한 순으로 정렬한다', () => {
    const r = recommendPlaces(saved, { inCourse: [], visited: [] });
    expect(r.map((p) => p.placeId)).toEqual(['b', 'c', 'a']);
  });

  it('이미 코스에 담긴 장소는 뺀다', () => {
    const r = recommendPlaces(saved, { inCourse: ['b'], visited: [] });
    expect(r.map((p) => p.placeId)).toEqual(['c', 'a']);
  });

  it('이미 다녀온 장소는 뺀다', () => {
    const r = recommendPlaces(saved, { inCourse: [], visited: ['c'] });
    expect(r.map((p) => p.placeId)).toEqual(['b', 'a']);
  });

  it('코스·방문 양쪽에 걸린 장소도 한 번만 빠진다', () => {
    const r = recommendPlaces(saved, { inCourse: ['a'], visited: ['a'] });
    expect(r.map((p) => p.placeId)).toEqual(['b', 'c']);
  });

  it('limit으로 개수를 자른다', () => {
    const r = recommendPlaces(saved, { inCourse: [], visited: [], limit: 2 });
    expect(r.map((p) => p.placeId)).toEqual(['b', 'c']);
  });

  it('기본 상한은 10곳', () => {
    const many = Array.from({ length: 15 }, (_, i) => ({
      placeId: `p${i}`,
      savedAt: `2026-07-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
    }));
    expect(recommendPlaces(many, { inCourse: [], visited: [] })).toHaveLength(10);
  });

  it('후보가 없으면 빈 배열', () => {
    expect(recommendPlaces([], { inCourse: [], visited: [] })).toEqual([]);
  });

  it('원본 배열을 변형하지 않는다', () => {
    const copy = [...saved];
    recommendPlaces(saved, { inCourse: [], visited: [] });
    expect(saved).toEqual(copy);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx jest src/lib/__tests__/recommend.test.ts`
Expected: FAIL — `Cannot find module '../recommend'`

- [ ] **Step 3: 최소 구현**

```ts
/**
 * 다음 데이트에 담을 만한 장소 추천 — 알고리즘이 아니라 필터 + 정렬이다.
 * 찜한 곳 중 "그 데이트에 아직 안 담겼고, 아직 안 가본 곳"을 최근 찜한 순으로 준다.
 */

export interface RecommendCandidate {
  placeId: string;
  /** ISO timestamp — 찜한 시각 */
  savedAt: string;
}

const DEFAULT_LIMIT = 10;

export function recommendPlaces<T extends RecommendCandidate>(
  candidates: T[],
  opts: { inCourse: string[]; visited: string[]; limit?: number },
): T[] {
  const exclude = new Set([...opts.inCourse, ...opts.visited]);
  return candidates
    .filter((c) => !exclude.has(c.placeId))
    .slice() // 원본 보존
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .slice(0, opts.limit ?? DEFAULT_LIMIT);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx jest src/lib/__tests__/recommend.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/recommend.ts src/lib/__tests__/recommend.test.ts
git commit -m "feat(lib): 다음 데이트 장소 추천 규칙"
```

---

### Task 3: `api/playlists.ts` — 찜 플리 조회·토글·전체 저장 장소

**Files:**
- Modify: `src/api/playlists.ts`

**Interfaces:**
- Consumes: Task 1의 `playlists.kind = 'saved'`.
- Produces:
  ```ts
  export interface PlaylistSummary { id: string; name: string; kind: 'custom' | 'saved'; placeCount: number }
  export function useSavedPlaylistId(): string | undefined
  export function useToggleSavedPlace(): UseMutationResult<void, Error, { placeId: string; saved: boolean }>
  export interface SavedPlaceItem {
    placeId: string; name: string; category: string | null; address: string | null;
    playlistId: string; playlistName: string; playlistKind: 'custom' | 'saved';
    savedAt: string; photoThumbs: string[];
  }
  export function useSavedPlaces(): UseQueryResult<SavedPlaceItem[]>
  ```

- [ ] **Step 1: `usePlaylists`에 `kind` 추가 + 찜 우선 정렬**

`PlaylistSummary` 인터페이스와 `usePlaylists` 본문을 아래로 교체한다.

```ts
export interface PlaylistSummary {
  id: string;
  name: string;
  kind: 'custom' | 'saved';
  placeCount: number;
}

export function usePlaylists() {
  const couple = useMyCouple();
  return useQuery({
    enabled: !!couple.data,
    queryKey: ['playlists'],
    queryFn: async (): Promise<PlaylistSummary[]> => {
      const { data, error } = await supabase
        .from('playlists')
        .select('id, name, kind, playlist_places(place_id)')
        .order('created_at');
      if (error) throw error;
      return data
        .map((p) => ({
          id: p.id,
          name: p.name,
          kind: (p.kind === 'saved' ? 'saved' : 'custom') as 'custom' | 'saved',
          placeCount: p.playlist_places?.length ?? 0,
        }))
        // 찜은 항상 맨 위
        .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'saved' ? -1 : 1));
    },
  });
}

/** 커플의 찜 플레이리스트 id — 트리거가 보장하므로 연결된 커플이면 항상 존재한다 */
export function useSavedPlaylistId(): string | undefined {
  const playlists = usePlaylists();
  return playlists.data?.find((p) => p.kind === 'saved')?.id;
}
```

- [ ] **Step 2: 찜 토글 훅 추가**

파일 끝에 추가한다.

```ts
/** 장소 찜 토글 — 찜 플레이리스트에 넣고 뺀다 */
export function useToggleSavedPlace() {
  const qc = useQueryClient();
  const savedId = useSavedPlaylistId();
  return useMutation({
    mutationFn: async ({ placeId, saved }: { placeId: string; saved: boolean }) => {
      if (!savedId) throw new Error('찜 목록을 찾지 못했어요');
      if (saved) {
        const { error } = await supabase
          .from('playlist_places')
          .delete()
          .eq('playlist_id', savedId)
          .eq('place_id', placeId);
        if (error) throw error;
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData.user?.id;
        if (!uid) throw new Error('로그인이 필요해요');
        const { error } = await supabase
          .from('playlist_places')
          .insert({ playlist_id: savedId, place_id: placeId, added_by: uid });
        if (error && !error.message.includes('duplicate')) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playlists'] });
      qc.invalidateQueries({ queryKey: ['savedPlaces'] });
    },
  });
}
```

- [ ] **Step 3: 전체 저장 장소 조회 훅 추가**

```ts
export interface SavedPlaceItem {
  placeId: string;
  name: string;
  category: string | null;
  address: string | null;
  playlistId: string;
  playlistName: string;
  playlistKind: 'custom' | 'saved';
  savedAt: string;
  /** 우리가 이 장소를 낀 데이트 수 — 추천에서 "이미 가본 곳"을 거르는 근거 */
  visitCount: number;
  photoThumbs: string[];
}

/** 모든 플레이리스트(찜 + 테마)의 장소를 평탄화 — 장소 피커·추천이 함께 쓴다 */
export function useSavedPlaces() {
  const couple = useMyCouple();
  return useQuery({
    enabled: !!couple.data,
    queryKey: ['savedPlaces'],
    queryFn: async (): Promise<SavedPlaceItem[]> => {
      const { data, error } = await supabase
        .from('playlist_places')
        .select(
          'place_id, added_at, playlists(id, name, kind), places(id, name, category, address)',
        );
      if (error) throw error;
      const rows = (data ?? []).filter((r) => r.places && r.playlists);
      const visits = await visitStats(rows.map((r) => r.place_id));
      return rows.map((r) => ({
        placeId: r.place_id,
        name: r.places!.name,
        category: r.places!.category,
        address: r.places!.address,
        playlistId: r.playlists!.id,
        playlistName: r.playlists!.name,
        playlistKind: (r.playlists!.kind === 'saved' ? 'saved' : 'custom') as 'custom' | 'saved',
        savedAt: r.added_at,
        visitCount: visits.get(r.place_id)?.count ?? 0,
        photoThumbs: visits.get(r.place_id)?.thumbs ?? [],
      }));
    },
  });
}
```

시각 컬럼은 `created_at`이 아니라 **`added_at`**이다 (`schema_v1.sql:158`). `visitStats`는 이 파일에
이미 있는 private 헬퍼이며 `{ count, thumbs }`를 준다.

- [ ] **Step 4: 타입 확인**

Run: `npm run typecheck`
Expected: 통과. 실패하면 `usePlaylists`를 쓰는 화면의 `kind` 누락을 함께 고친다.

- [ ] **Step 5: Commit**

```bash
git add src/api/playlists.ts
git commit -m "feat(api): 찜 플리 조회·토글·전체 저장 장소 훅"
```

---

### Task 4: `api/places.ts` 저장된 장소 담기 + `api/tracks.ts`에서 `liked` 제거

**Files:**
- Modify: `src/api/places.ts`
- Modify: `src/api/tracks.ts`

**Interfaces:**
- Produces: `export function useAddSavedPlaceToTrack(trackId: string): UseMutationResult<void, Error, { placeId: string; sortOrder: number }>`
- `TrackListItem`·`TrackDetail`에서 `liked` 필드 사라짐, `useUpdateTrack`의 patch에서 `liked` 사라짐.

- [ ] **Step 1: 저장된 장소를 코스에 꽂는 훅 추가**

`src/api/places.ts`의 `useAddTrackPlace` 아래에 추가한다. 찜한 장소는 이미 `places.id`가 있으므로 upsert하지 않는다.

```ts
/** 이미 저장된 장소(찜·테마 플리)를 코스에 담기 — upsert 불필요 */
export function useAddSavedPlaceToTrack(trackId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { placeId: string; sortOrder: number }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error('로그인이 필요해요');
      const { error } = await supabase.from('track_places').insert({
        track_id: trackId,
        place_id: input.placeId,
        sort_order: input.sortOrder,
        added_by: uid,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['track', trackId] });
      qc.invalidateQueries({ queryKey: ['tracks'] });
    },
  });
}
```

- [ ] **Step 2: `api/tracks.ts`에서 `liked` 제거**

세 곳을 고친다.
1. `TrackListItem` 인터페이스에서 `liked: boolean;` 줄 삭제
2. `useAllTracks`의 select 문자열 `id, title, date, liked,` → `id, title, date,` 로, map의 `liked: t.liked,` 줄 삭제
3. `TrackDetail` 인터페이스의 `liked: boolean;` 삭제, `useTrack`의 select에서 `liked,` 제거, map의 `liked: t.liked,` 삭제
4. `useUpdateTrack`의 patch 타입에서 `liked?: boolean;` 삭제, 본문의 `...(patch.liked !== undefined && { liked: patch.liked }),` 삭제

- [ ] **Step 3: 타입 확인 — 아직 실패해야 정상**

Run: `npm run typecheck`
Expected: FAIL — `feed/favorites.tsx`, `feed/settings.tsx`, `track/[id]/index.tsx`가 `liked`를 참조한다. Task 5에서 고친다.

- [ ] **Step 4: Commit**

```bash
git add src/api/places.ts src/api/tracks.ts
git commit -m "feat(api): 저장된 장소 코스 담기 + tracks.liked 제거"
```

---

### Task 5: 앨범 ♡ UI 제거

**Files:**
- Delete: `src/app/(tabs)/feed/favorites.tsx`
- Modify: `src/app/(tabs)/feed/settings.tsx`
- Modify: `src/app/track/[id]/index.tsx`

**Interfaces:**
- Consumes: Task 4의 `liked` 제거.
- Produces: 앱 어디에도 앨범 ♡ 없음. `npm run typecheck` 통과 복구.

- [ ] **Step 1: Favorites 화면 삭제**

```bash
git rm src/app/\(tabs\)/feed/favorites.tsx
```

- [ ] **Step 2: 설정의 Favorites 진입점 제거**

`src/app/(tabs)/feed/settings.tsx`에서 아래 블록과 바로 뒤의 `<Divider />` 한 개를 삭제한다.

```tsx
        <LinkRow
          icon={<Text style={{ fontFamily: typeface, color: color.me, fontSize: 16 }}>♥</Text>}
          label="Favorites"
          sub={`아껴둔 앨범 ${favorites.length}`}
          onPress={() => router.push('/feed/favorites')}
        />
```

같은 파일의 `const favorites = (tracks.data ?? []).filter((t) => t.liked);` 줄도 삭제한다.
그 결과 `useAllTracks` 호출(`const tracks = useAllTracks();`)이 이 파일에서 안 쓰이면 그것과 import도 함께 지운다.

- [ ] **Step 3: 앨범 상세의 ♥ 버튼 제거**

`src/app/track/[id]/index.tsx`에서 아래 블록을 삭제한다.

```tsx
          {/* Favorites */}
          <Pressable
            onPress={() => update.mutate({ liked: !t.liked })}
            style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <Text style={{ fontFamily: typeface, fontSize: 18, color: t.liked ? role.me : color.muted }}>
              {t.liked ? '♥' : '♡'}
            </Text>
            <Meta style={{ fontSize: 12 }}>{t.liked ? 'Favorites에 있음' : 'Favorites에 추가'}</Meta>
          </Pressable>
```

`update`(= `useUpdateTrack`)는 제목 수정에도 쓰이므로 남긴다. 삭제 후 `role` import가 이 파일에서 안 쓰이면 정리한다.

- [ ] **Step 4: 타입·테스트 확인**

Run: `npm run typecheck && npm test`
Expected: 둘 다 PASS. `liked` 참조가 하나도 없어야 한다 —
`grep -rn "liked" src/` → `PostCard.tsx`의 `likedBy`/`iLiked`(게시물 좋아요, 별개)만 남는다.

- [ ] **Step 5: Commit**

```bash
git add -u src/app
git commit -m "refactor(feed): 앨범 ♡(Favorites) 제거 — 하트는 장소에만"
```

---

### Task 6: 공용 컴포넌트 — `SavedHeart`, `PlaceThumb`

**Files:**
- Create: `src/components/SavedHeart.tsx`
- Create: `src/components/PlaceThumb.tsx`

**Interfaces:**
- Consumes: Task 3의 `useToggleSavedPlace`(호출은 화면이 하고, 컴포넌트는 props만 받는다).
- Produces:
  ```ts
  export function SavedHeart(props: { saved: boolean; onPress: () => void; size?: number }): JSX.Element
  export function PlaceThumb(props: { placeId: string; name: string; thumbUrl?: string | null; size: number }): JSX.Element
  ```

- [ ] **Step 1: `SavedHeart` 작성**

```tsx
import { Pressable, Text } from 'react-native';
import { color, typeface } from '@/theme/tokens';

/** 장소 찜 토글 하트 — 표현만 한다(props-only). 상태·뮤테이션은 화면이 들고 있는다. */
export function SavedHeart({
  saved,
  onPress,
  size = 20,
}: {
  saved: boolean;
  onPress: () => void;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 2 })}
    >
      <Text style={{ fontFamily: typeface, fontSize: size, color: saved ? color.date : color.muted }}>
        {saved ? '♥' : '♡'}
      </Text>
    </Pressable>
  );
}
```

- [ ] **Step 2: `PlaceThumb` 작성**

사진이 있으면 사진, 없으면 장소 id로 결정적인 생성 자켓. 네이버는 장소 이미지를 주지 않으므로 이게 유일한 채움 수단이다.

```tsx
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { color, coverPalette, typeface } from '@/theme/tokens';
import { coverSeedIndex } from '@/lib/cover';

/**
 * 장소 썸네일 — 다녀온 곳은 그 데이트 사진, 안 가본 곳은 생성 자켓.
 * (네이버 지역검색은 장소 이미지를 제공하지 않는다.)
 */
export function PlaceThumb({
  placeId,
  name,
  thumbUrl,
  size,
}: {
  placeId: string;
  name: string;
  thumbUrl?: string | null;
  size: number;
}) {
  if (thumbUrl) {
    return (
      <Image
        source={thumbUrl}
        style={{ width: size, height: size, borderRadius: 8, backgroundColor: color.surface2 }}
        contentFit="cover"
      />
    );
  }
  const [light, dark] = coverPalette[coverSeedIndex(placeId, coverPalette.length)];
  return (
    <LinearGradient
      colors={[light, dark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: typeface,
          fontWeight: '800',
          fontSize: Math.round(size * 0.34),
          color: color.white,
        }}
      >
        {name.slice(0, 1)}
      </Text>
    </LinearGradient>
  );
}
```

- [ ] **Step 3: 타입 확인**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/SavedHeart.tsx src/components/PlaceThumb.tsx
git commit -m "feat(components): 장소 찜 하트·썸네일"
```

---

### Task 7: `create-track.tsx` — 날짜 + 제목 폼으로 축소

**Files:**
- Modify: `src/app/modals/create-track.tsx`

**Interfaces:**
- Consumes: 기존 `useCreateTrack({ date, title? })`.
- Produces: 모달이 앨범을 만들고 곧바로 `/track/<id>`로 이동. `PickPlaces`·`finish()`의 수동 루프 삭제.

- [ ] **Step 1: 화면 본문 교체**

`CreateTrack` 컴포넌트와 `PickPlaces`를 아래로 바꾼다. `PickDate`는 그대로 두되 `onNext`가 제목 단계로 간다.

```tsx
/** 데이트 만들기 — 1) 날짜 2) 제목. 장소는 앨범을 만든 뒤 상세에서 담는다. */
export default function CreateTrack() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const seeded = params.date && isISODate(params.date) ? params.date : '';
  const [step, setStep] = useState<1 | 2>(seeded ? 2 : 1);
  const [date, setDate] = useState(seeded);
  const [title, setTitle] = useState('');

  const create = useCreateTrack();
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    if (!date || saving) return;
    setSaving(true);
    try {
      const trackId = await create.mutateAsync({ date, title });
      router.dismiss();
      router.push(`/track/${trackId}`);
    } catch (e) {
      Alert.alert('저장 실패', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar
        title="데이트 만들기"
        right={<Text style={{ fontFamily: typeface, fontSize: 12.5, color: color.sub }}>{step}/2</Text>}
      />
      {step === 1 ? (
        <PickDate date={date} onPick={setDate} onNext={() => date && setStep(2)} />
      ) : (
        <PickTitle date={date} title={title} setTitle={setTitle} onDone={finish} saving={saving} />
      )}
    </View>
  );
}

/* ---------- step 2: 제목 ---------- */
function PickTitle({
  date,
  title,
  setTitle,
  onDone,
  saving,
}: {
  date: string;
  title: string;
  setTitle: (s: string) => void;
  onDone: () => void;
  saving: boolean;
}) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
        <Text
          style={{ fontFamily: typeface, fontWeight: '800', fontSize: 23, color: color.white, letterSpacing: -0.4 }}
        >
          어떤 데이트인가요?
        </Text>
        <Meta style={{ marginTop: 8 }}>
          {date.replaceAll('-', '.')} · 장소는 만든 뒤에 담을 수 있어요.
        </Meta>
        <TextInput
          value={title}
          onChangeText={setTitle}
          autoFocus
          placeholder="예: 성수 카페 투어"
          placeholderTextColor={color.muted}
          style={{
            marginTop: 20,
            height: 48,
            borderRadius: 6,
            backgroundColor: color.surface2,
            paddingHorizontal: 14,
            color: color.white,
            fontFamily: typeface,
            fontSize: 16,
          }}
        />
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ padding: 16, paddingBottom: 26 }}>
        <Pressable
          disabled={saving}
          onPress={onDone}
          style={({ pressed }) => ({
            height: 48,
            borderRadius: 999,
            backgroundColor: role.me,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed || saving ? 0.85 : 1,
          })}
        >
          {saving ? (
            <ActivityIndicator color={color.onPrimary} />
          ) : (
            <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 14.5, color: color.onPrimary }}>
              만들기
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
```

`PickPlaces` 함수 전체와, 그것만 쓰던 import(`usePlaceSearch`, `useAddTrackPlace`, `SearchPlace`, `Eyebrow`, `ScrollView`가 다른 데서 안 쓰이면 그것도)를 삭제한다.

- [ ] **Step 2: 제목이 비면 'Untitled'가 되는지 확인**

`useCreateTrack`이 이미 `input.title?.trim() || 'Untitled'`로 처리한다 — 추가 분기 불필요.

- [ ] **Step 3: 아키텍처 위반이 사라졌는지 확인**

Run: `grep -rn "from '@/api/supabase'" src/app src/components`
Expected: 결과 없음 (화면·컴포넌트에서 supabase 직접 import 0건)

- [ ] **Step 4: 타입 확인**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/modals/create-track.tsx
git commit -m "refactor(track): 데이트 만들기를 날짜+제목 폼으로 — 장소는 앨범 만든 뒤에"
```

---

### Task 8: `place-search.tsx` — `[찜한 곳] [검색]` 세그먼트

**Files:**
- Modify: `src/app/modals/place-search.tsx`

**Interfaces:**
- Consumes: Task 3 `useSavedPlaces`·`useToggleSavedPlace`, Task 4 `useAddSavedPlaceToTrack`, Task 6 `SavedHeart`·`PlaceThumb`.
- Produces: 데이트에서 진입하면(`trackId`) 찜한 곳이 기본 세그먼트.

- [ ] **Step 1: 세그먼트 상태와 헤더 추가**

`PlaceSearch` 컴포넌트 상단(`const [query, setQuery] = useState('');` 앞)에 추가한다.

```tsx
  // 데이트에 담으러 왔으면 찜부터 — 이게 이 화면의 핵심 동선이다.
  // 플리에 담으러 왔으면 찜에서 찜으로 담는 셈이라 검색이 기본.
  const [tab, setTab] = useState<'saved' | 'search'>(trackId ? 'saved' : 'search');
  const savedPlaces = useSavedPlaces();
  const addSaved = useAddSavedPlaceToTrack(trackId ?? '');
```

import에 다음을 추가한다.

```tsx
import { useSavedPlaces, useAddPlaylistPlace } from '@/api/playlists';
import { useAddSavedPlaceToTrack, usePlaceSearch, useAddTrackPlace } from '@/api/places';
import { PlaceThumb } from '@/components/PlaceThumb';
import { FilterChip } from '@/components/FilterChip';
```

`TopBar` 바로 아래에 세그먼트를 넣는다.

```tsx
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 10 }}>
        <FilterChip selected={tab === 'saved'} onPress={() => setTab('saved')}>
          찜한 곳
        </FilterChip>
        <FilterChip selected={tab === 'search'} onPress={() => setTab('search')}>
          검색
        </FilterChip>
      </View>
```

- [ ] **Step 2: 검색 입력과 결과를 `tab === 'search'`로 감싸기**

기존 `TextInput` 블록과 결과 `ScrollView`를 `{tab === 'search' && ( ... )}`로 감싼다.

- [ ] **Step 3: 찜한 곳 목록 렌더 추가**

```tsx
      {tab === 'saved' && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
          {savedPlaces.isPending ? (
            <ActivityIndicator color={role.me} style={{ marginTop: 24 }} />
          ) : (savedPlaces.data ?? []).length === 0 ? (
            <Meta style={{ paddingVertical: 16 }}>
              아직 찜한 곳이 없어요. 검색 탭에서 마음에 드는 곳을 찜해보세요.
            </Meta>
          ) : (
            (savedPlaces.data ?? []).map((p) => {
              const added = addedIds.has(p.placeId);
              return (
                <View
                  key={`${p.playlistId}:${p.placeId}`}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 }}
                >
                  <PlaceThumb placeId={p.placeId} name={p.name} thumbUrl={p.photoThumbs[0]} size={44} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.white }}>
                      {p.name}
                    </Text>
                    <Meta style={{ marginTop: 2, fontSize: 12 }}>
                      {[p.playlistName, p.category].filter(Boolean).join(' · ')}
                    </Meta>
                  </View>
                  <Pressable
                    disabled={added || !trackId}
                    onPress={() =>
                      addSaved.mutate(
                        { placeId: p.placeId, sortOrder: Number(next ?? 0) + addedIds.size },
                        { onSuccess: () => setAddedIds((s) => new Set(s).add(p.placeId)) },
                      )
                    }
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      borderWidth: added ? 0 : 1.5,
                      borderColor: color.sub,
                      backgroundColor: added ? role.me : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: added ? color.bg : color.white, fontFamily: typeface, fontWeight: '700' }}>
                      {added ? '✓' : '+'}
                    </Text>
                  </Pressable>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
```

`addedIds`는 기존에 `naver_id`를 담던 Set을 그대로 쓴다 — 찜 경로는 `placeId`를 넣으므로 키 공간이 섞이지 않는다.

- [ ] **Step 4: 검색 결과 행에 찜 하트 추가**

검색 결과 행의 `+` 버튼 왼쪽에 `SavedHeart`를 넣는다. 검색 결과는 아직 `places.id`가 없으므로,
하트를 누르면 먼저 `upsertPlace`로 행을 만든 뒤 토글해야 한다. 이는 Task 3의 `useToggleSavedPlace`가
`placeId`를 요구하므로 화면에서 `upsertPlace`를 호출하게 되는데, 이는 api/ 규칙 위반이다.
**따라서 `api/playlists.ts`에 검색 결과 전용 훅을 하나 더 추가한다:**

```ts
/** 검색 결과(아직 places 행이 없는 장소)를 찜에 담기 */
export function useSaveSearchPlace() {
  const qc = useQueryClient();
  const savedId = useSavedPlaylistId();
  return useMutation({
    mutationFn: async (place: SearchPlace) => {
      if (!savedId) throw new Error('찜 목록을 찾지 못했어요');
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error('로그인이 필요해요');
      const placeId = await upsertPlace(place);
      const { error } = await supabase
        .from('playlist_places')
        .insert({ playlist_id: savedId, place_id: placeId, added_by: uid });
      if (error && !error.message.includes('duplicate')) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playlists'] });
      qc.invalidateQueries({ queryKey: ['savedPlaces'] });
    },
  });
}
```

화면에서는 이렇게 쓴다.

```tsx
const saveSearch = useSaveSearchPlace();
const [justSaved, setJustSaved] = useState<Set<string>>(new Set());
// 검색 결과 행 안에서:
<SavedHeart
  saved={justSaved.has(p.naver_id)}
  onPress={() =>
    saveSearch.mutate(p, { onSuccess: () => setJustSaved((s) => new Set(s).add(p.naver_id)) })
  }
/>
```

- [ ] **Step 5: 타입 확인 + 커밋**

Run: `npm run typecheck`
Expected: PASS

```bash
git add src/app/modals/place-search.tsx src/api/playlists.ts src/components/SavedHeart.tsx
git commit -m "feat(place): 장소 담기에 [찜한 곳] 세그먼트 + 검색 결과 찜하기"
```

---

### Task 9: 플레이리스트 탭 재구성

**Files:**
- Create: `src/components/playlist/RecommendStrip.tsx`
- Modify: `src/app/(tabs)/playlist/index.tsx`
- Delete: `src/app/(tabs)/playlist/[month].tsx`

**Interfaces:**
- Consumes: Task 2 `recommendPlaces`, Task 3 `useSavedPlaces`·`usePlaylists`, Task 4 `useAddSavedPlaceToTrack`, Task 6 `PlaceThumb`.
- Produces: 탭 구성이 `앨범 캐러셀 → 다음 데이트 추천 → 찜·테마 플리`. 월별 아카이브 없음.

- [ ] **Step 1: `RecommendStrip` 작성**

```tsx
import { Pressable, ScrollView, Text, View } from 'react-native';
import { color, typeface } from '@/theme/tokens';
import { Meta } from '@/components/Meta';
import { PlaceThumb } from '@/components/PlaceThumb';

export type RecommendItem = {
  placeId: string;
  name: string;
  category: string | null;
  thumbUrl?: string | null;
};

/** 다가오는 데이트에 담을 만한 찜 장소 — 가로 스트립. 담기 버튼이 코스에 바로 꽂는다. */
export function RecommendStrip({
  items,
  addedIds,
  onAdd,
}: {
  items: RecommendItem[];
  addedIds: Set<string>;
  onAdd: (placeId: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingVertical: 4 }}
    >
      {items.map((p) => {
        const added = addedIds.has(p.placeId);
        return (
          <View key={p.placeId} style={{ width: 128 }}>
            <PlaceThumb placeId={p.placeId} name={p.name} thumbUrl={p.thumbUrl} size={128} />
            <Text
              numberOfLines={1}
              style={{ marginTop: 8, fontFamily: typeface, fontWeight: '600', fontSize: 13.5, color: color.white }}
            >
              {p.name}
            </Text>
            <Meta numberOfLines={1} style={{ marginTop: 1, fontSize: 11.5 }}>
              {p.category ?? ' '}
            </Meta>
            <Pressable
              disabled={added}
              onPress={() => onAdd(p.placeId)}
              style={({ pressed }) => ({
                marginTop: 8,
                height: 30,
                borderRadius: 999,
                backgroundColor: added ? color.surface3 : color.date,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: typeface,
                  fontWeight: '700',
                  fontSize: 12.5,
                  color: added ? color.sub : color.onPrimary,
                }}
              >
                {added ? '담김' : '이 데이트에 담기'}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}
```

- [ ] **Step 2: 플리 탭 본문 교체**

`PlaylistRoot`에서 `months` useMemo와 "아카이브" 섹션 전체를 삭제하고, 추천 섹션을 넣는다.

```tsx
  const savedPlaces = useSavedPlaces();

  // 다가오는 데이트 = 아직 안 온 앨범 중 가장 이른 것
  const upcoming = useMemo(() => {
    const future = (tracks.data ?? [])
      .filter((t) => !isReleased(t.date))
      .sort((a, b) => a.date.localeCompare(b.date));
    return future[0];
  }, [tracks.data]);

  const addToUpcoming = useAddSavedPlaceToTrack(upcoming?.id ?? '');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // 찜한 곳 중 이 데이트에 아직 안 담겼고 안 가본 곳.
  // "가본 곳" 판정은 visitCount로 한다 — photoThumbs로 대신하면 사진 없이 다녀온 곳이 새 곳으로 잡힌다.
  const recommended = useMemo(() => {
    const all = savedPlaces.data ?? [];
    const saved = all.filter((p) => p.playlistKind === 'saved');
    const visited = all.filter((p) => p.visitCount > 0).map((p) => p.placeId);
    return recommendPlaces(saved, { inCourse: [...addedIds], visited });
  }, [savedPlaces.data, addedIds]);
```

렌더에서 캐러셀 아래에 넣는다.

```tsx
      {upcoming && recommended.length > 0 && (
        <>
          <SectionHeader title={`${upcoming.date.slice(5).replace('-', '.')} 데이트에 담을 곳`} />
          <View style={{ paddingTop: 10 }}>
            <RecommendStrip
              items={recommended.map((p) => ({
                placeId: p.placeId,
                name: p.name,
                category: p.category,
                thumbUrl: p.photoThumbs[0],
              }))}
              addedIds={addedIds}
              onAdd={(placeId) =>
                addToUpcoming.mutate(
                  { placeId, sortOrder: addedIds.size },
                  { onSuccess: () => setAddedIds((s) => new Set(s).add(placeId)) },
                )
              }
            />
          </View>
        </>
      )}
```

"테마 플레이리스트" 섹션 제목은 `"찜 · 플레이리스트"`로 바꾸고, 목록은 `usePlaylists()`가 이미 찜을 맨 위로
정렬해 주므로 그대로 map한다. 단 찜 항목에는 삭제 진입점을 두지 않는다(현재 목록에 삭제 UI가 없으므로 추가 작업 없음).

`contentContainerStyle`의 `paddingBottom: 32`를 `paddingBottom: 132`로 바꾼다 — 탭바(56)와 FAB(56+16)에
목록 마지막 항목이 가리는 문제를 함께 고친다.

- [ ] **Step 3: 월별 아카이브 라우트 삭제**

```bash
git rm src/app/\(tabs\)/playlist/\[month\].tsx
```

`monthKey` import가 `playlist/index.tsx`에서 안 쓰이면 함께 정리한다.

- [ ] **Step 4: 검증**

Run: `npm test && npm run typecheck`
Expected: 둘 다 PASS

Run: `grep -rn "playlist/\[month\]\|playlist/\${" src/`
Expected: 결과 없음 (죽은 링크 없음)

- [ ] **Step 5: Commit**

```bash
git add -A src/app src/components
git commit -m "feat(playlist): 캐러셀 + 다음 데이트 장소 추천으로 재구성, 월별 아카이브 제거"
```

---

### Task 10: 전체 흐름 수동 검증

**Files:** 없음 (실행 검증)

- [ ] **Step 1: 앱 실행**

Run: `npx expo start --web --port 8081`
브라우저에서 `F12` → `Ctrl+Shift+M`으로 모바일 뷰포트.

- [ ] **Step 2: 성공 기준 한 바퀴**

1. 플리 탭 → 장소 담기에서 **검색 → 하트로 찜**
2. 캘린더 FAB `+` → **데이트** → 미래 날짜 + 제목 → 앨범 생성 → 상세로 이동
3. 플리 탭 → **"○.○ 데이트에 담을 곳"** 섹션에 방금 찜한 장소가 보인다
4. **이 데이트에 담기** → 버튼이 "담김"으로 바뀐다
5. 앨범 상세로 가면 코스에 그 장소가 있다

Expected: 5단계가 끊김 없이 이어진다. 이것이 이 플랜의 성공 기준이다.

- [ ] **Step 3: 회귀 확인**

- 앨범 상세에 ♥가 없다
- 설정에 Favorites 줄이 없다
- 플리 탭에 월별 아카이브 섹션이 없다
- 플리 목록 맨 위가 "찜"이고, 목록 마지막 항목이 FAB에 가리지 않는다

- [ ] **Step 4: Commit (문서 갱신)**

CLAUDE.md의 마일스톤에서 "플레이리스트 재정의 이행" 항목을 체크하고 구조 메모를 갱신한다.

```bash
git add CLAUDE.md
git commit -m "docs: 찜·플레이리스트 재정의 반영"
```

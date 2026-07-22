# 플레이리스트 재정의 Phase 1 — 장소 ♡ 좋아요 시스템 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 개인별 장소 ♡ 좋아요를 도입한다 — 누르면 "좋아한 장소" 시스템 플레이리스트에 쌓이고, 커플 둘 다 누른 장소는 "매칭"으로 표시된다.

**Architecture:** 신규 `place_likes` 테이블(개인별, PK `(place_id, user_id)`, 커플 스코프 RLS)을 추가하고, 매칭 판정은 순수 함수 `lib/places.ts`에 둔다. ♡ 토글/조회는 `api/likes.ts` 훅으로 캡슐화하고, 표현은 `components/LikeHeart.tsx` + `좋아한 장소` 목록 화면으로 낸다. 의존성 방향(`app/ → components/ → api/·lib/`)을 지킨다.

**Tech Stack:** Expo SDK 57 / RN 0.86 / TS strict / expo-router / Supabase(Postgres·RLS) / TanStack Query / Jest(jest-expo).

이 플랜은 `docs/superpowers/specs/2026-07-13-playlist-album-track-design.md`의 "♡ 좋아요와 플레이리스트의 관계" · "place_likes (신규)" · "♡의 위치" 부분을 구현한다. (홈 세그먼트화 = Phase 2, `playlist_items` 혼합 = Phase 3 — 별도 플랜.)

## Global Constraints

- **모든 색상은 `@/theme/tokens` 참조** — hex 하드코딩 금지. 3역할 키: `role.me`(나=green `#1ED760`) / `role.partner`(상대=pink `#E8688F`) / `role.anniv`(기념일=amber). 반투명 배경은 `roleBg.me`/`roleBg.partner`.
- **모든 텍스트는 `fontFamily: typeface`(= `'Pretendard'`) + 명시적 `fontWeight`.**
- **`lib/`는 순수 함수만** — React·RN·Supabase·Expo import 금지. 콜로케이트 테스트 `src/lib/__tests__/<name>.test.ts`, `now`는 파라미터 주입(mock 금지), `describe`/`it` 한글 라벨.
- **Supabase 접근은 `api/`로만** — 화면·컴포넌트에서 `supabase` 직접 import 금지. 쿼리는 `api/`의 TanStack Query 훅으로.
- **날짜는 `'YYYY-MM-DD'` 문자열**, KST 연산은 `@/lib/date` 경유.
- import는 `@/` alias 사용(`@/theme/tokens`, `@/lib/...`, `@/components/...`, `@/api/...`); `api/` 내부끼리는 상대경로(`./supabase` 등).
- 마이그레이션 파일명: `<YYYYMMDD><6자리>_<snake>.sql`, 현재 최신 timestamp는 `20260716000001` → 신규는 `20260716000002`.
- 검증 명령: `npm test`(jest), `npm run typecheck`(tsc --noEmit).

---

## File Structure

- **Create** `supabase/migrations/20260716000002_place_likes.sql` — `place_likes` 테이블 + RLS.
- **Modify** `src/types/database.types.ts` — `place_likes` Row/Insert/Update/Relationships 추가(regen 결과와 동일하게 수기 반영; 나중에 `gen types` 재실행이 진실).
- **Create** `src/lib/places.ts` — `LikeState`, `foldLikes`, `isMatch` (순수).
- **Create** `src/lib/__tests__/places.test.ts` — 위 순수 함수 테스트.
- **Create** `src/api/likes.ts` — `usePlaceLikes`(조회), `useTogglePlaceLike`(토글).
- **Create** `src/components/LikeHeart.tsx` — ♡ 하트 버튼(내 상태 + 매칭 점).
- **Create** `src/app/(tabs)/playlist/liked.tsx` — "좋아한 장소" 목록 화면.
- **Modify** `src/app/modals/place-search.tsx` — 검색 결과 각 행에 ♡.
- **Modify** `src/app/place/[id].tsx` — 장소 상세 히어로/칩 줄에 ♡.
- **Modify** `src/app/(tabs)/playlist/index.tsx` — (임시) 홈 상단에 "좋아한 장소" 진입 줄 1개(Phase 2에서 세그먼트로 대체).

---

### Task 1: `place_likes` 마이그레이션

**Files:**
- Create: `supabase/migrations/20260716000002_place_likes.sql`

**Interfaces:**
- Produces: 테이블 `public.place_likes(place_id uuid, user_id uuid, couple_id uuid, created_at timestamptz)`, PK `(place_id, user_id)`; RLS 정책 `place_likes_select|insert|delete`.

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- 장소 ♡ 좋아요 — 개인별(유저별). "좋아한 장소" 시스템 플레이리스트의 실체. (플레이리스트 재정의 Phase 1)
-- 커플 공유 조회(RLS): 같은 커플이면 서로의 ♡가 보인다 → 둘 다 누른 장소 = 매칭.
create table public.place_likes (
  place_id uuid not null references public.places (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  couple_id uuid not null references public.couples (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (place_id, user_id)
);
create index place_likes_couple_idx on public.place_likes (couple_id);

alter table public.place_likes enable row level security;

-- 조회: 같은 커플의 ♡ 전부(내 것 + 상대 것) — 매칭 판정에 필요
create policy "place_likes_select" on public.place_likes for select
  using (couple_id = public.my_couple_id());
-- 추가: 내 행만, 내 커플 스코프
create policy "place_likes_insert" on public.place_likes for insert
  with check (user_id = auth.uid() and couple_id = public.my_couple_id());
-- 삭제: 내 행만
create policy "place_likes_delete" on public.place_likes for delete
  using (user_id = auth.uid());
```

- [ ] **Step 2: 로컬 스택에 적용해 통과 확인** (Docker 필요)

Run: `npx supabase db reset`
Expected: 에러 없이 모든 마이그레이션 적용, `place_likes` 생성 로그.

- [ ] **Step 3: 타입 재생성**

Run: `npx supabase gen types typescript --local > src/types/database.types.ts`
Expected: 파일에 `place_likes:` 블록이 생김. (Docker/CLI 불가 환경이면 Task 2에서 수기 반영.)

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260716000002_place_likes.sql src/types/database.types.ts
git commit -m "feat(likes): place_likes 테이블 + RLS"
```

---

### Task 2: 생성 타입에 `place_likes` 반영 (Step 3에서 regen 못 했을 때만)

**Files:**
- Modify: `src/types/database.types.ts` (`Tables` 블록, 알파벳 순서상 `photos:` 뒤 · `places:` 앞)

**Interfaces:**
- Produces: `Database['public']['Tables']['place_likes']` Row/Insert/Update 타입.

> Task 1 Step 3에서 `gen types`가 성공했다면 이 태스크는 건너뛴다(이미 반영됨). CLI/Docker가 없을 때만 수기로 넣는다.

- [ ] **Step 1: `place_likes` 블록 추가**

`src/types/database.types.ts`의 `Tables:` 안, `places: {` 정의 바로 **앞**에 삽입:

```ts
      place_likes: {
        Row: {
          couple_id: string
          created_at: string
          place_id: string
          user_id: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          place_id: string
          user_id: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          place_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "place_likes_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "place_likes_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
```

- [ ] **Step 2: 타입 컴파일 확인**

Run: `npm run typecheck`
Expected: PASS (place_likes 참조가 아직 없으므로 이 단계는 기존 에러만 없으면 OK).

- [ ] **Step 3: Commit** (Task 1에서 커밋 못 했으면 함께)

```bash
git add src/types/database.types.ts
git commit -m "chore(types): place_likes 타입 수기 반영"
```

---

### Task 3: `lib/places.ts` — 매칭 판정 순수 함수 (TDD)

**Files:**
- Create: `src/lib/places.ts`
- Test: `src/lib/__tests__/places.test.ts`

**Interfaces:**
- Produces:
  - `type LikeState = { me: boolean; partner: boolean }`
  - `foldLikes(rows: { placeId: string; userId: string }[], myUid: string): Map<string, LikeState>`
  - `isMatch(s: LikeState): boolean`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/__tests__/places.test.ts`:

```ts
import { foldLikes, isMatch } from '../places';

describe('foldLikes', () => {
  const ME = 'u-me';
  it('내 행은 me=true', () => {
    expect(foldLikes([{ placeId: 'p1', userId: ME }], ME).get('p1')).toEqual({ me: true, partner: false });
  });
  it('상대 행은 partner=true', () => {
    expect(foldLikes([{ placeId: 'p1', userId: 'u-other' }], ME).get('p1')).toEqual({ me: false, partner: true });
  });
  it('둘 다 누른 장소는 me·partner 모두 true', () => {
    const m = foldLikes([{ placeId: 'p1', userId: ME }, { placeId: 'p1', userId: 'u-other' }], ME);
    expect(m.get('p1')).toEqual({ me: true, partner: true });
  });
  it('없는 장소는 undefined', () => {
    expect(foldLikes([], ME).get('p1')).toBeUndefined();
  });
});

describe('isMatch', () => {
  it('둘 다면 매칭', () => {
    expect(isMatch({ me: true, partner: true })).toBe(true);
  });
  it('한쪽만이면 매칭 아님', () => {
    expect(isMatch({ me: true, partner: false })).toBe(false);
    expect(isMatch({ me: false, partner: true })).toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- places`
Expected: FAIL — `Cannot find module '../places'`.

- [ ] **Step 3: 최소 구현**

`src/lib/places.ts`:

```ts
/** 장소 ♡ 좋아요 — 순수 판정 로직. (플레이리스트 재정의) */

export type LikeState = { me: boolean; partner: boolean };

/** (placeId, userId) 행들을 장소별 나·상대 상태로 접는다. myUid 기준으로 me/partner 판별. */
export function foldLikes(
  rows: { placeId: string; userId: string }[],
  myUid: string,
): Map<string, LikeState> {
  const map = new Map<string, LikeState>();
  for (const r of rows) {
    const s = map.get(r.placeId) ?? { me: false, partner: false };
    if (r.userId === myUid) s.me = true;
    else s.partner = true;
    map.set(r.placeId, s);
  }
  return map;
}

/** 둘 다 눌렀으면 매칭 — 다음 데이트 후보 신호. */
export function isMatch(s: LikeState): boolean {
  return s.me && s.partner;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- places`
Expected: PASS (6개).

- [ ] **Step 5: Commit**

```bash
git add src/lib/places.ts src/lib/__tests__/places.test.ts
git commit -m "feat(lib): 장소 ♡ 매칭 판정 순수 함수"
```

---

### Task 4: `api/likes.ts` — ♡ 조회·토글 훅

**Files:**
- Create: `src/api/likes.ts`

**Interfaces:**
- Consumes: `supabase`(`./supabase`), `useMyCouple`(`./couple` → `data.coupleId`), `useSession`(`./auth` → `data.user.id`), `upsertPlace` + `SearchPlace`(`./places`), `foldLikes`/`isMatch`/`LikeState`(`@/lib/places`).
- Produces:
  - `interface LikedPlace { placeId: string; naverId: string | null; name: string; category: string | null; address: string | null; link: string | null; like: LikeState; match: boolean }`
  - `usePlaceLikes(): UseQueryResult<LikedPlace[]>` — queryKey `['place_likes']`
  - `useTogglePlaceLike(): UseMutationResult` — `mutate({ place: SearchPlace | { id: string }; liked: boolean })`

- [ ] **Step 1: 파일 작성**

`src/api/likes.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useMyCouple } from './couple';
import { useSession } from './auth';
import { upsertPlace, type SearchPlace } from './places';
import { foldLikes, isMatch, type LikeState } from '@/lib/places';

export interface LikedPlace {
  placeId: string;
  naverId: string | null;
  name: string;
  category: string | null;
  address: string | null;
  link: string | null;
  like: LikeState;
  match: boolean;
}

const KEY = ['place_likes'];

/** 커플의 ♡ 장소 전부 — 장소 정보 + 나/상대 상태 + 매칭. 최근 좋아요 순, 장소별 1행. */
export function usePlaceLikes() {
  const couple = useMyCouple();
  const session = useSession();
  const uid = session.data?.user.id;
  return useQuery({
    enabled: !!couple.data && !!uid,
    queryKey: KEY,
    queryFn: async (): Promise<LikedPlace[]> => {
      const { data, error } = await supabase
        .from('place_likes')
        .select('place_id, user_id, created_at, places(id, naver_id, name, category, address, link)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const folded = foldLikes(
        (data ?? []).map((r) => ({ placeId: r.place_id, userId: r.user_id })),
        uid!,
      );
      const seen = new Set<string>();
      const out: LikedPlace[] = [];
      for (const r of data ?? []) {
        if (seen.has(r.place_id)) continue;
        seen.add(r.place_id);
        const pl = r.places as {
          id: string; naver_id: string | null; name: string;
          category: string | null; address: string | null; link: string | null;
        } | null;
        if (!pl) continue;
        const like = folded.get(r.place_id) ?? { me: false, partner: false };
        out.push({
          placeId: r.place_id, naverId: pl.naver_id, name: pl.name,
          category: pl.category, address: pl.address, link: pl.link,
          like, match: isMatch(like),
        });
      }
      return out;
    },
  });
}

/** ♡ 토글. place가 검색결과(SearchPlace)면 upsert 후, 이미 DB면 { id } 그대로. liked=원하는 다음 상태. */
export function useTogglePlaceLike() {
  const qc = useQueryClient();
  const couple = useMyCouple();
  const session = useSession();
  const uid = session.data?.user.id;
  return useMutation({
    mutationFn: async (input: { place: SearchPlace | { id: string }; liked: boolean }) => {
      if (!uid || !couple.data) throw new Error('로그인·연결이 필요해요');
      const placeId = 'id' in input.place ? input.place.id : await upsertPlace(input.place);
      if (input.liked) {
        const { error } = await supabase
          .from('place_likes')
          .insert({ place_id: placeId, user_id: uid, couple_id: couple.data.coupleId });
        if (error && !error.message.includes('duplicate')) throw error;
      } else {
        const { error } = await supabase
          .from('place_likes')
          .delete()
          .eq('place_id', placeId)
          .eq('user_id', uid);
        if (error) throw error;
      }
      return placeId;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
```

> 주의: `SearchPlace`에 `id` 필드가 없어야 `'id' in place` 판별이 성립한다. `api/places.ts`의 `SearchPlace` 정의를 확인하고, 만약 `id`가 있으면 판별 키를 `'naver_id' in place`로 바꾼다.

- [ ] **Step 2: 타입 확인**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/api/likes.ts
git commit -m "feat(api): 장소 ♡ 조회·토글 훅"
```

---

### Task 5: `LikeHeart` 컴포넌트

**Files:**
- Create: `src/components/LikeHeart.tsx`

**Interfaces:**
- Produces: `LikeHeart({ liked, matched?, onToggle, size? })` — `liked:boolean`(내가 눌렀나), `matched?:boolean`(둘 다), `onToggle:()=>void`, `size?:number=22`.

- [ ] **Step 1: 컴포넌트 작성**

`src/components/LikeHeart.tsx`:

```tsx
import { Pressable, Text, View } from 'react-native';
import { color, role, typeface } from '@/theme/tokens';

type Props = {
  liked: boolean;
  matched?: boolean;
  onToggle: () => void;
  size?: number;
};

/** 장소 ♡ 하트 — 내가 누르면 green ♥, 매칭(둘 다)이면 옆에 상대 핑크 점. */
export function LikeHeart({ liked, matched, onToggle, size = 22 }: Props) {
  return (
    <Pressable
      onPress={onToggle}
      hitSlop={8}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
    >
      <Text style={{ fontFamily: typeface, fontSize: size, color: liked ? role.me : color.muted }}>
        {liked ? '♥' : '♡'}
      </Text>
      {matched && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: role.partner }} />}
    </Pressable>
  );
}
```

- [ ] **Step 2: 타입 확인**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/LikeHeart.tsx
git commit -m "feat(ui): LikeHeart ♡ 컴포넌트"
```

---

### Task 6: "좋아한 장소" 목록 화면

**Files:**
- Create: `src/app/(tabs)/playlist/liked.tsx`

**Interfaces:**
- Consumes: `usePlaceLikes`, `useTogglePlaceLike`(`@/api/likes`), `LikeHeart`(`@/components/LikeHeart`), `TopBar`/`Meta`.
- Produces: 라우트 `/(tabs)/playlist/liked` (파일 라우팅, 기존 Stack `_layout`이 자동 등록).

- [ ] **Step 1: 화면 작성**

`src/app/(tabs)/playlist/liked.tsx`:

```tsx
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { color, role, roleBg, typeface } from '@/theme/tokens';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';
import { LikeHeart } from '@/components/LikeHeart';
import { usePlaceLikes, useTogglePlaceLike } from '@/api/likes';

/** 좋아한 장소 — 시스템 플레이리스트 (플레이리스트 재정의 Phase 1) */
export default function LikedPlaces() {
  const router = useRouter();
  const likes = usePlaceLikes();
  const toggle = useTogglePlaceLike();
  const list = likes.data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar title="좋아한 장소" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        {list.length === 0 ? (
          <Meta style={{ paddingVertical: 24, textAlign: 'center' }}>
            아직 좋아한 장소가 없어요 — 장소에서 ♡를 눌러 담아보세요
          </Meta>
        ) : (
          list.map((l) => (
            <View
              key={l.placeId}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}
            >
              <Pressable style={{ flex: 1, minWidth: 0 }} onPress={() => router.push(`/place/${l.placeId}`)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text
                    numberOfLines={1}
                    style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.white }}
                  >
                    {l.name}
                  </Text>
                  {l.match && (
                    <View
                      style={{
                        paddingHorizontal: 7,
                        height: 18,
                        borderRadius: 999,
                        backgroundColor: roleBg.partner,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 10, color: role.partner }}>
                        매칭
                      </Text>
                    </View>
                  )}
                </View>
                <Meta style={{ marginTop: 2, fontSize: 12 }}>
                  {[l.category, l.address].filter(Boolean).join(' · ')}
                </Meta>
              </Pressable>
              <LikeHeart
                liked={l.like.me}
                matched={l.match}
                onToggle={() => toggle.mutate({ place: { id: l.placeId }, liked: !l.like.me })}
              />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 2: 타입 확인**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(tabs)/playlist/liked.tsx"
git commit -m "feat(playlist): 좋아한 장소 목록 화면"
```

---

### Task 7: 장소 검색 결과에 ♡

**Files:**
- Modify: `src/app/modals/place-search.tsx`

**Interfaces:**
- Consumes: `usePlaceLikes`, `useTogglePlaceLike`(`@/api/likes`), `LikeHeart`.

- [ ] **Step 1: import 추가**

`src/app/modals/place-search.tsx` 상단 import 블록에 추가:

```tsx
import { LikeHeart } from '@/components/LikeHeart';
import { usePlaceLikes, useTogglePlaceLike } from '@/api/likes';
```

- [ ] **Step 2: 훅 + 내가 ♡한 naver_id 집합 계산**

`const [addedIds, setAddedIds] = useState<Set<string>>(new Set());` 아래에 추가:

```tsx
  const likes = usePlaceLikes();
  const toggleLike = useTogglePlaceLike();
  const likedNaver = new Set(
    (likes.data ?? []).filter((l) => l.like.me && l.naverId).map((l) => l.naverId as string),
  );
```

- [ ] **Step 3: 결과 행에 하트 넣기**

검색 결과 행의 `+`/`✓` `<Pressable>` **앞**(같은 행, 담기 버튼 왼쪽)에 삽입:

```tsx
                  <LikeHeart
                    liked={likedNaver.has(p.naver_id)}
                    onToggle={() => toggleLike.mutate({ place: p, liked: !likedNaver.has(p.naver_id) })}
                  />
```

> `p`는 `SearchPlace`(네이버 결과)라 `upsertPlace`가 처리한다. 언라이크도 `upsertPlace`가 기존 id를 돌려주므로 동작한다.

- [ ] **Step 4: 타입 확인**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/modals/place-search.tsx
git commit -m "feat(playlist): 검색 결과에 ♡"
```

---

### Task 8: 장소 상세에 ♡

**Files:**
- Modify: `src/app/place/[id].tsx`

**Interfaces:**
- Consumes: `usePlaceLikes`, `useTogglePlaceLike`, `LikeHeart`.

- [ ] **Step 1: import 추가**

```tsx
import { LikeHeart } from '@/components/LikeHeart';
import { usePlaceLikes, useTogglePlaceLike } from '@/api/likes';
```

- [ ] **Step 2: 현재 장소의 ♡ 상태 계산**

`const p = detail.data;` 아래에 추가:

```tsx
  const likes = usePlaceLikes();
  const toggleLike = useTogglePlaceLike();
  const mine = likes.data?.find((l) => l.placeId === id);
  const iLiked = !!mine?.like.me;
```

- [ ] **Step 3: 칩 줄에 하트 배치**

`방문 {p?.visitCount ?? 0}회` 칩과 "네이버에서 보기" 칩이 있는 `<View style={{ flexDirection: 'row', gap: 8, ... }}>` 안, 칩들 **뒤**에 추가(같은 줄 우측). 하트가 우측으로 밀리도록 그 View에 `alignItems: 'center'`가 있는지 확인하고, 하트 앞에 스페이서를 둔다:

```tsx
          <View style={{ flex: 1 }} />
          <LikeHeart
            liked={iLiked}
            matched={!!mine?.match}
            onToggle={() => toggleLike.mutate({ place: { id: id! }, liked: !iLiked })}
          />
```

- [ ] **Step 4: 타입 확인**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/place/[id].tsx"
git commit -m "feat(playlist): 장소 상세에 ♡"
```

---

### Task 9: 플리 홈에서 "좋아한 장소" 진입 (임시)

**Files:**
- Modify: `src/app/(tabs)/playlist/index.tsx`

**Interfaces:**
- Consumes: `usePlaceLikes`(`@/api/likes`). 라우트 `/(tabs)/playlist/liked`로 push.

> Phase 2에서 홈이 `리스트`/`아카이브` 세그먼트로 재구성되면 이 진입 줄은 세그먼트의 "좋아한 장소" 카드로 대체된다. Phase 1에서는 ♡ 루프를 끝까지(담기→목록 확인) 확인 가능하게 하는 최소 진입점.

- [ ] **Step 1: import + 훅**

`import { usePlaylists } from '@/api/playlists';` 아래에 추가:

```tsx
import { usePlaceLikes } from '@/api/likes';
```

컴포넌트 본문 `const playlists = usePlaylists();` 아래:

```tsx
  const likes = usePlaceLikes();
```

- [ ] **Step 2: 헤더 아래 진입 줄 추가**

헤더 `</View>`(닫는 태그, 현재 파일에서 헤더 블록 끝) 바로 **뒤**, `noTracks ? (...)` 분기 **앞**에 삽입:

```tsx
      <Pressable
        onPress={() => router.push('/(tabs)/playlist/liked')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginHorizontal: 16,
          marginTop: 14,
          padding: 14,
          borderRadius: 12,
          backgroundColor: color.surface1,
        }}
      >
        <View
          style={{
            width: 44, height: 44, borderRadius: 8, backgroundColor: roleBg.me,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 20, color: role.me }}>♥</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 15, color: color.white }}>
            좋아한 장소
          </Text>
          <Meta style={{ marginTop: 2, fontSize: 12.5 }}>{likes.data?.length ?? 0}곳</Meta>
        </View>
        <Text style={{ fontFamily: typeface, color: color.muted }}>›</Text>
      </Pressable>
```

- [ ] **Step 3: `roleBg` import 확인**

`import { color, role, typeface } from '@/theme/tokens';`를 `import { color, role, roleBg, typeface } from '@/theme/tokens';`로 (이미 있으면 생략).

- [ ] **Step 4: 타입 확인**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(tabs)/playlist/index.tsx"
git commit -m "feat(playlist): 홈에 좋아한 장소 진입(임시)"
```

---

### Task 10: 전체 검증 (수동 E2E)

**Files:** 없음 (검증만).

- [ ] **Step 1: 단위 테스트 + 타입**

Run: `npm test` → 전부 PASS, `npm run typecheck` → PASS.

- [ ] **Step 2: 로컬 앱 한 바퀴** (dev client / 로컬 Supabase)

1. 캘린더에서 데이트(앨범) 하나 → `+ 장소 담기` → 검색 → 결과 행의 ♡ 탭 → ♥(green)로 바뀜.
2. 플레이리스트 탭 상단 "좋아한 장소" → 방금 장소가 목록에 보임.
3. 장소 상세(`/place/[id]`)에서 ♡ 토글 → 목록에서 사라짐/다시 생김.
4. (2인 검증 가능하면) 상대 계정으로 같은 장소 ♡ → 목록 이름 옆 "매칭" 배지 확인.

- [ ] **Step 3: 검증 스킬**

`verify` 스킬로 위 흐름을 실제 앱에서 구동해 관찰(테스트·타입만으로 완료 주장 금지).

---

## Self-Review

**1. Spec coverage (스펙의 Phase 1 해당 항목):**
- "place_likes (신규)" — Task 1(+2 타입) ✅
- "♡는 개인별, 둘 다면 매칭" — Task 3(`foldLikes`/`isMatch`) ✅
- "api/likes.ts 신규(♡ 토글, 낙관적 업데이트)" — Task 4 ✅ (단, **낙관적 업데이트는 미포함** — invalidate-only. Phase 2 폴리시로 이월. 아래 참고.)
- "lib/places.ts 신규(매칭 판정)" — Task 3 ✅ ("플리 항목 정렬"은 Phase 3로 이월.)
- "♡의 위치: 피커·장소 상세" — Task 7·8 ✅. (플리 내부·앨범 수록곡 ♡ = Phase 2로 이월 — 홈/플리 재구성과 함께.)
- "좋아한 장소 = 시스템 플레이리스트" — Task 6 목록 화면 ✅

**2. Placeholder scan:** 모든 코드 스텝에 실제 코드 포함. "적절히 처리" 류 없음. ✅

**3. Type consistency:** `LikeState`(lib) → `api/likes`가 재수출 사용; `LikedPlace.like: LikeState`; `useTogglePlaceLike.mutate({ place, liked })` 시그니처가 Task 6·7·8·9에서 동일하게 호출됨. `usePlaceLikes` queryKey `['place_likes']`와 토글 `onSettled` invalidate 키 일치. ✅

**4. Ambiguity:**
- `SearchPlace`에 `id` 유무 → Task 4 Step 1 주석에서 판별 키 대안 명시. ✅
- 낙관적 업데이트를 뺀 것은 의도적(단순·정확 우선, YAGNI). ♡ 탭 후 invalidate로 재조회되어 반영됨 — 체감 지연이 문제되면 Phase 2에서 `useReorderTrackPlaces` 패턴으로 `onMutate` 추가.

**의존 순서:** Task 1 → 2 → 3 → 4 → (5) → 6·7·8·9 (5 이후는 서로 독립) → 10.

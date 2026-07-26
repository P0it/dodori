# 커플 아케이드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 오늘 탭에 "하루 한 종목, 3판 중 최고점으로 커플 대결"하는 미니게임 섹션을 붙인다.

**Architecture:** 종목은 KST 날짜로 결정론적 배정(`epochDay % 7`, 추천곡·주제와 동형). 점수는 `game_scores`에 커플당 하루 두 행(나·상대)으로 저장하고, "내가 마쳐야 상대 점수가 열린다"를 `topics`의 `has_voted` RLS 패턴을 복제한 `has_played`로 서버가 강제한다. 도메인 규칙(배정·승패·주간 전적)은 전부 `lib/games.ts` 순수 함수. 종목 UI 7개는 게임엔진 없이 타이머 + `Pressable`.

**Tech Stack:** Expo SDK 57 / RN 0.86 / TypeScript strict / expo-router / Supabase(Postgres·RLS·Realtime·Edge Functions) / TanStack Query.

**Spec:** `docs/superpowers/specs/2026-07-27-couple-arcade-design.md`

## Global Constraints

- 모든 색상은 `src/theme/tokens.ts` 토큰 참조 — hex 하드코딩 금지.
- 모든 날짜 연산은 `src/lib/date.ts` 경유(Asia/Seoul 고정). `new Date()` 직접 날짜 비교 금지.
- `lib/`는 순수 함수만(React·Supabase·RN import 금지) — 유일한 단위 테스트 대상.
- Supabase 접근은 `api/`로만. `components/`는 props-only. 화면(`app/`)은 조합만.
- 커밋 전 `npm run typecheck` + `npm test` 통과. `git add`는 만진 파일만 경로로 명시(`-A` 금지).
- 커밋 메시지는 한글 Conventional Commits. 브랜치 `main`.
- 종목 카탈로그 순서 고정: `idx 0 = reaction(월)` … `idx 6 = sequence(일)`.

---

### Task 1: 종목 카탈로그 + 오늘의 종목 배정 (`lib/games.ts`)

**Files:**
- Create: `src/lib/games.ts`
- Test: `src/lib/__tests__/games.test.ts`

**Interfaces:**
- Consumes: `toEpochDay`, `type ISODate` from `@/lib/date`.
- Produces:
  - `interface GameDef { key: string; name: string; blurb: string; unit: 'ms' | 'count' | 'level'; higherIsBetter: boolean; format: (score: number) => string }`
  - `const GAME_CATALOG: GameDef[]` (길이 7)
  - `function pickTodayGame(today: ISODate): GameDef`

- [ ] **Step 1: 실패하는 테스트 작성** — `src/lib/__tests__/games.test.ts`

```ts
import { GAME_CATALOG, pickTodayGame } from '../games';

describe('GAME_CATALOG', () => {
  it('7종목, key 중복 없음', () => {
    expect(GAME_CATALOG).toHaveLength(7);
    expect(new Set(GAME_CATALOG.map((g) => g.key)).size).toBe(7);
  });

  it('idx 0 = reaction (월요일 자리)', () => {
    expect(GAME_CATALOG[0].key).toBe('reaction');
    expect(GAME_CATALOG[6].key).toBe('sequence');
  });
});

describe('pickTodayGame', () => {
  it('같은 날은 항상 같은 종목', () => {
    expect(pickTodayGame('2026-07-27')).toBe(pickTodayGame('2026-07-27'));
  });

  it('하루 지나면 다음 idx', () => {
    const i = GAME_CATALOG.indexOf(pickTodayGame('2026-07-27'));
    const j = GAME_CATALOG.indexOf(pickTodayGame('2026-07-28'));
    expect(j).toBe((i + 1) % 7);
  });

  it('7일 주기로 순환', () => {
    expect(pickTodayGame('2026-07-27')).toBe(pickTodayGame('2026-08-03'));
  });

  it('2026-07-27은 월요일 → reaction', () => {
    // epochDay % 7 이 요일에 고정됨을 못박는다 (2026-07-27 = 월요일)
    expect(pickTodayGame('2026-07-27').key).toBe('reaction');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- games`
Expected: FAIL — `Cannot find module '../games'`

- [ ] **Step 3: 최소 구현** — `src/lib/games.ts`

```ts
/**
 * 커플 아케이드 도메인 규칙 — 순수 함수만. 종목 배정·승패·주간 전적.
 * 종목 UI는 여기 없다(components/game/). 여기는 규칙과 카탈로그다.
 */
import { toEpochDay, type ISODate } from './date';

export interface GameDef {
  key: string;
  name: string;
  blurb: string;
  unit: 'ms' | 'count' | 'level';
  /** 점수 방향: true면 높을수록 승, false면 낮을수록 승 */
  higherIsBetter: boolean;
  format: (score: number) => string;
}

/**
 * 카탈로그 순서가 곧 요일(`epochDay % 7`). idx 0 = 월요일.
 * 종목을 추가하면 이 배열과 GameHost 스위치만 늘리면 된다.
 */
export const GAME_CATALOG: GameDef[] = [
  { key: 'reaction', name: '반응속도', blurb: '초록으로 바뀌는 순간 탭 — 5번의 평균',
    unit: 'ms', higherIsBetter: false, format: (s) => `${Math.round(s)}ms` },
  { key: 'whack', name: '두더지 잡기', blurb: '15초 동안 튀어나오는 칸을 탭',
    unit: 'count', higherIsBetter: true, format: (s) => `${s}마리` },
  { key: 'oddcolor', name: '색 다른 칸 찾기', blurb: '딱 하나 다른 색을 탭 — 단계마다 어려워짐',
    unit: 'level', higherIsBetter: true, format: (s) => `${s}단계` },
  { key: 'tensec', name: '정확히 10초', blurb: '타이머를 숨긴 채 10.000초에 정지',
    unit: 'ms', higherIsBetter: false, format: (s) => `${(s / 1000).toFixed(2)}초 오차` },
  { key: 'taprush', name: '탭 연타', blurb: '10초 동안 몇 번이나 누를 수 있나',
    unit: 'count', higherIsBetter: true, format: (s) => `${s}번` },
  { key: 'stroop', name: '글자색 고르기', blurb: '글자의 뜻이 아니라 글자색을 고른다 — 30초',
    unit: 'count', higherIsBetter: true, format: (s) => `${s}개` },
  { key: 'sequence', name: '숫자 순서 탭', blurb: '흩어진 1~25를 순서대로',
    unit: 'ms', higherIsBetter: false, format: (s) => `${(s / 1000).toFixed(1)}초` },
];

/** 오늘의 종목 — KST 날짜가 곧 인덱스 (추천곡·주제와 동형) */
export function pickTodayGame(today: ISODate): GameDef {
  const i = ((toEpochDay(today) % GAME_CATALOG.length) + GAME_CATALOG.length) % GAME_CATALOG.length;
  return GAME_CATALOG[i];
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- games`
Expected: PASS (7 tests)

Note: `2026-07-27`이 월요일임을 확인하고 카탈로그 idx 0을 맞췄다. 실제로 다른 요일이면
`toEpochDay('2026-07-27') % 7` 값을 계산해 카탈로그 회전이 아니라 **테스트의 날짜**를 맞는 월요일로 바꾼다(카탈로그 순서는 월=0 고정 유지).

- [ ] **Step 5: 커밋**

```bash
git add src/lib/games.ts src/lib/__tests__/games.test.ts
git commit -m "feat(game): 종목 카탈로그 7종 + 오늘의 종목 결정론적 배정"
```

---

### Task 2: 승패·주간 전적 규칙 (`lib/games.ts` 확장)

**Files:**
- Modify: `src/lib/games.ts` (함수 추가)
- Test: `src/lib/__tests__/games.test.ts` (describe 추가)

**Interfaces:**
- Consumes: `addDays`, `fromEpochDay`, `toEpochDay`, `type ISODate` from `@/lib/date`.
- Produces:
  - `type Outcome = 'win' | 'lose' | 'draw'`
  - `function outcome(mine: number, theirs: number, higherIsBetter: boolean): Outcome`
  - `function weekBounds(today: ISODate): { start: ISODate; end: ISODate }`
  - `interface DailyResult { date: ISODate; mine: number | null; theirs: number | null; higherIsBetter: boolean }`
  - `interface WeekTally { win: number; draw: number; lose: number }`
  - `function tally(rows: DailyResult[]): WeekTally`

- [ ] **Step 1: 실패하는 테스트 추가** — `src/lib/__tests__/games.test.ts` 하단에

```ts
import { outcome, weekBounds, tally, type DailyResult } from '../games';

describe('outcome', () => {
  it('높을수록 승: 큰 쪽이 win', () => {
    expect(outcome(12, 8, true)).toBe('win');
    expect(outcome(8, 12, true)).toBe('lose');
  });
  it('낮을수록 승: 작은 쪽이 win', () => {
    expect(outcome(210, 300, false)).toBe('win');
    expect(outcome(300, 210, false)).toBe('lose');
  });
  it('동점은 무승부', () => {
    expect(outcome(10, 10, true)).toBe('draw');
    expect(outcome(10, 10, false)).toBe('draw');
  });
});

describe('weekBounds', () => {
  it('월요일~일요일 (KST). 2026-07-29(수)이 낀 주', () => {
    // 2026-07-27 월 … 2026-08-02 일
    expect(weekBounds('2026-07-29')).toEqual({ start: '2026-07-27', end: '2026-08-02' });
  });
  it('월요일 자신은 그 주의 시작', () => {
    expect(weekBounds('2026-07-27').start).toBe('2026-07-27');
  });
  it('일요일은 그 주의 끝', () => {
    expect(weekBounds('2026-08-02').start).toBe('2026-07-27');
  });
});

describe('tally', () => {
  const row = (mine: number | null, theirs: number | null, hib: boolean): DailyResult =>
    ({ date: '2026-07-27', mine, theirs, higherIsBetter: hib });

  it('양쪽 다 낸 날만 집계', () => {
    const rows = [row(12, 8, true), row(5, null, true), row(null, 9, true)];
    expect(tally(rows)).toEqual({ win: 1, draw: 0, lose: 0 });
  });
  it('승/무/패 합산', () => {
    const rows = [row(12, 8, true), row(8, 8, true), row(200, 300, false), row(300, 200, false)];
    expect(tally(rows)).toEqual({ win: 2, draw: 1, lose: 1 });
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- games`
Expected: FAIL — `outcome is not a function` 등

- [ ] **Step 3: 구현 추가** — `src/lib/games.ts` 상단 import에 `addDays`, `fromEpochDay` 추가하고 하단에

```ts
export type Outcome = 'win' | 'lose' | 'draw';

/** 내 최고점 vs 상대 최고점. 방향(higherIsBetter)으로 종목별 대소를 흡수 */
export function outcome(mine: number, theirs: number, higherIsBetter: boolean): Outcome {
  if (mine === theirs) return 'draw';
  const iAmBigger = mine > theirs;
  const iWin = higherIsBetter ? iAmBigger : !iAmBigger;
  return iWin ? 'win' : 'lose';
}

/** 이번 주 월~일 (KST). epochDay 0(1970-01-01)은 목요일 → +3으로 월=0 정렬 */
export function weekBounds(today: ISODate): { start: ISODate; end: ISODate } {
  const e = toEpochDay(today);
  const mondayOffset = ((e + 3) % 7 + 7) % 7;
  const start = fromEpochDay(e - mondayOffset);
  return { start, end: addDays(start, 6) };
}

export interface DailyResult {
  date: ISODate;
  mine: number | null;
  theirs: number | null;
  higherIsBetter: boolean;
}
export interface WeekTally { win: number; draw: number; lose: number }

/** 이번 주 전적 — 양쪽 다 점수를 낸 날만 승/무/패에 넣는다 */
export function tally(rows: DailyResult[]): WeekTally {
  const t: WeekTally = { win: 0, draw: 0, lose: 0 };
  for (const r of rows) {
    if (r.mine === null || r.theirs === null) continue;
    const o = outcome(r.mine, r.theirs, r.higherIsBetter);
    t[o === 'win' ? 'win' : o === 'lose' ? 'lose' : 'draw'] += 1;
  }
  return t;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- games`
Expected: PASS (전체)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/games.ts src/lib/__tests__/games.test.ts
git commit -m "feat(game): 승패 판정 + 이번 주 전적(월~일 KST) 규칙"
```

---

### Task 3: `game_scores` 테이블 + RLS + 마이그레이션 적용

**Files:**
- Create: `supabase/migrations/20260727000001_game_scores.sql`
- Modify: `src/types/database.types.ts` (재생성)

**Interfaces:**
- Produces: `game_scores` 테이블, `public.has_played(date)` 함수. 이후 api/ 훅이 의존.

- [ ] **Step 1: 마이그레이션 작성** — `supabase/migrations/20260727000001_game_scores.sql`

```sql
-- ============================================================
-- 커플 아케이드 — 하루 한 종목, 3판 중 최고점. 커플당 하루 두 행(나·상대).
-- 핵심: "내가 한 판이라도 마쳐야 상대 점수가 열린다"를 RLS(has_played)로 강제.
-- topics의 has_voted 패턴 복제 — 클라이언트에서 가리면 쿼리 한 번에 뚫린다.
-- ============================================================

create table public.game_scores (
  couple_id uuid not null references public.couples (id) on delete cascade,
  game_date date not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  game_key text not null,
  best_score numeric not null,
  attempts integer not null default 1 check (attempts between 1 and 3),
  higher_is_better boolean not null,
  updated_at timestamptz not null default now(),
  primary key (couple_id, game_date, user_id)
);
create index game_scores_week_idx on public.game_scores (couple_id, game_date);

-- 내가 오늘(p_date) 한 판이라도 냈는가. 정책 재귀 회피 위해 security definer.
create or replace function public.has_played(p_date date)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.game_scores
    where game_date = p_date and user_id = auth.uid() and couple_id = public.my_couple_id()
  )
$$;

alter table public.game_scores enable row level security;

-- 내 행은 항상, 상대 행은 내가 오늘 마친 뒤에만
create policy "game_scores_select" on public.game_scores for select using (
  couple_id = public.my_couple_id()
  and (user_id = auth.uid() or public.has_played(game_date))
);
create policy "game_scores_insert" on public.game_scores for insert with check (
  couple_id = public.my_couple_id() and user_id = auth.uid()
);
-- upsert의 on conflict update 경로용 (내 행만)
create policy "game_scores_update" on public.game_scores for update
  using (couple_id = public.my_couple_id() and user_id = auth.uid())
  with check (couple_id = public.my_couple_id() and user_id = auth.uid());

alter publication supabase_realtime add table public.game_scores;

grant select, insert, update, delete on public.game_scores to anon, authenticated, service_role;
grant execute on function public.has_played(date) to anon, authenticated, service_role;
```

- [ ] **Step 2: 로컬 스택에 적용**

Run: `npx supabase db reset`
Expected: 모든 마이그레이션 재적용, 에러 없음. (Docker 필요)

- [ ] **Step 3: 타입 재생성**

Run: `npx supabase gen types typescript --local > src/types/database.types.ts`
Expected: `game_scores` Row/Insert/Update 타입이 파일에 나타남

- [ ] **Step 4: typecheck**

Run: `npm run typecheck`
Expected: PASS (기존 코드 영향 없음)

- [ ] **Step 5: 커밋**

```bash
git add supabase/migrations/20260727000001_game_scores.sql src/types/database.types.ts
git commit -m "feat(game): game_scores 테이블 + has_played RLS(내가 마쳐야 상대 점수 공개)"
```

---

### Task 4: 데이터 훅 (`api/games.ts`)

**Files:**
- Create: `src/api/games.ts`
- Reference: `src/api/songs.ts`(useQuery 패턴), `src/api/couple.ts`(useCoupleProfiles), `src/api/auth.ts`(useSession)

**Interfaces:**
- Consumes: `supabase` from `./supabase`; `useMyCouple`/`useSession` 등 기존 훅; `pickTodayGame`, `weekBounds`, `type DailyResult` from `@/lib/games`; `todayKST`, `type ISODate` from `@/lib/date`.
- Produces:
  - `interface Score { userId: string; bestScore: number; attempts: number }`
  - `function useTodayGameScores(): { data?: { mine: Score | null; partner: Score | null }, ... }`
  - `function useWeekOutcomes(): { data?: DailyResult[], ... }`
  - `function useSubmitRound(): mutation` — `mutate(score: number)`; 성공 시 `{ attempts: number; best: number } | null`(상한 도달 시 null)

- [ ] **Step 1: 구현** — `src/api/games.ts`

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useSession } from './auth';
import { useCoupleProfiles } from './couple';
import { todayKST } from '@/lib/date';
import { pickTodayGame, weekBounds, type DailyResult } from '@/lib/games';

export interface Score { userId: string; bestScore: number; attempts: number }

/** 오늘의 내/상대 점수. 상대는 RLS 때문에 내가 마치기 전엔 항상 안 온다(null). */
export function useTodayGameScores() {
  const session = useSession();
  const uid = session.data?.user.id ?? '';
  const today = todayKST();
  return useQuery({
    queryKey: ['gameScores', today],
    enabled: !!uid,
    queryFn: async (): Promise<{ mine: Score | null; partner: Score | null }> => {
      const { data, error } = await supabase
        .from('game_scores')
        .select('user_id, best_score, attempts')
        .eq('game_date', today);
      if (error) throw error;
      const rows = (data ?? []).map((r) => ({
        userId: r.user_id, bestScore: Number(r.best_score), attempts: r.attempts,
      }));
      return {
        mine: rows.find((r) => r.userId === uid) ?? null,
        partner: rows.find((r) => r.userId !== uid) ?? null,
      };
    },
  });
}

/** 이번 주(월~일) 전적용 원자료 — 날짜별 나/상대 점수 + 그날 종목의 방향 */
export function useWeekOutcomes() {
  const session = useSession();
  const uid = session.data?.user.id ?? '';
  const today = todayKST();
  const { start, end } = weekBounds(today);
  return useQuery({
    queryKey: ['gameWeek', start],
    enabled: !!uid,
    queryFn: async (): Promise<DailyResult[]> => {
      const { data, error } = await supabase
        .from('game_scores')
        .select('game_date, user_id, best_score')
        .gte('game_date', start)
        .lte('game_date', end);
      if (error) throw error;
      const byDate = new Map<string, { mine: number | null; theirs: number | null }>();
      for (const r of data ?? []) {
        const slot = byDate.get(r.game_date) ?? { mine: null, theirs: null };
        if (r.user_id === uid) slot.mine = Number(r.best_score);
        else slot.theirs = Number(r.best_score);
        byDate.set(r.game_date, slot);
      }
      return [...byDate.entries()].map(([date, s]) => ({
        date, mine: s.mine, theirs: s.theirs, higherIsBetter: pickTodayGame(date).higherIsBetter,
      }));
    },
  });
}

/** 한 판 제출 — upsert. 서버가 best·3판 상한을 강제. 상한 도달 시 null 반환. */
export function useSubmitRound() {
  const qc = useQueryClient();
  const profiles = useCoupleProfiles();
  const session = useSession();
  const uid = session.data?.user.id ?? '';
  const today = todayKST();
  const game = pickTodayGame(today);

  return useMutation({
    mutationFn: async (score: number): Promise<{ attempts: number; best: number } | null> => {
      const coupleId = profiles.data?.coupleId;
      if (!coupleId) throw new Error('커플 없음');
      const { data, error } = await supabase
        .from('game_scores')
        .upsert(
          {
            couple_id: coupleId, game_date: today, user_id: uid, game_key: game.key,
            best_score: score, attempts: 1, higher_is_better: game.higherIsBetter,
          },
          { onConflict: 'couple_id,game_date,user_id', ignoreDuplicates: false },
        )
        .select('attempts, best_score')
        .maybeSingle();
      if (error) throw error;
      if (!data) return null; // where attempts < 3 → 0행 = 상한 도달
      return { attempts: data.attempts, best: Number(data.best_score) };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['gameScores', today] });
      qc.invalidateQueries({ queryKey: ['gameWeek'] });
      // 그날 첫 완료면 상대에게 알림 (부가물 — 실패해도 게임엔 영향 없음)
      if (res?.attempts === 1) {
        supabase.functions.invoke('notify-game').catch(() => {});
      }
    },
  });
}
```

- [ ] **Step 2: upsert의 `attempts+1`·best·`where attempts<3` 확인**

`onConflict` upsert만으로는 `attempts = attempts + 1`과 `where` 조건을 표현할 수 없다.
Supabase JS의 `.upsert()`는 전체 값 덮어쓰기라 증분이 불가능하므로, **Postgres 함수로 감싼다.**
Task 3 마이그레이션에 아래 RPC를 추가하고(같은 파일 하단), 이 훅의 `mutationFn`을 RPC 호출로 교체한다.

마이그레이션에 추가할 RPC (`20260727000001_game_scores.sql` 하단):

```sql
-- 한 판 제출: 첫 판은 insert, 이후는 best 갱신 + attempts+1, 3판 넘으면 무시.
-- 반환: 상한 도달(무시)이면 null row. 방향(higher_is_better)은 서버가 저장값으로 판단.
create or replace function public.submit_game_round(
  p_game_key text, p_score numeric, p_higher_is_better boolean, p_date date
) returns public.game_scores
language plpgsql security definer set search_path = public as $$
declare
  result public.game_scores;
  cid uuid := public.my_couple_id();
begin
  if cid is null then raise exception '커플 없음'; end if;

  insert into public.game_scores
    (couple_id, game_date, user_id, game_key, best_score, attempts, higher_is_better)
  values (cid, p_date, auth.uid(), p_game_key, p_score, 1, p_higher_is_better)
  on conflict (couple_id, game_date, user_id) do update set
    attempts   = game_scores.attempts + 1,
    best_score = case when game_scores.higher_is_better
                      then greatest(game_scores.best_score, excluded.best_score)
                      else least(game_scores.best_score, excluded.best_score) end,
    updated_at = now()
  where game_scores.attempts < 3
  returning * into result;

  return result; -- 3판 도달 시 update 0행 → result는 null
end;
$$;
grant execute on function public.submit_game_round(text, numeric, boolean, date)
  to anon, authenticated, service_role;
```

그리고 `mutationFn`을 교체:

```ts
    mutationFn: async (score: number): Promise<{ attempts: number; best: number } | null> => {
      const { data, error } = await supabase.rpc('submit_game_round', {
        p_game_key: game.key, p_score: score,
        p_higher_is_better: game.higherIsBetter, p_date: today,
      });
      if (error) throw error;
      if (!data) return null; // 상한 도달
      return { attempts: data.attempts, best: Number(data.best_score) };
    },
```

RPC 추가 후 `npx supabase db reset` + 타입 재생성을 다시 돌리고, Task 3 커밋에 이 RPC가 포함되도록
Task 3와 함께 커밋하거나(권장) 별도 커밋한다.

- [ ] **Step 3: typecheck**

Run: `npm run typecheck`
Expected: PASS. (실패 시 database.types.ts 재생성 여부 확인)

- [ ] **Step 4: 커밋**

```bash
git add src/api/games.ts supabase/migrations/20260727000001_game_scores.sql src/types/database.types.ts
git commit -m "feat(game): 점수 조회·주간 전적·한 판 제출(RPC) 훅"
```

---

### Task 5: 공통 인터페이스 + GameHost + 게임 화면 뼈대 (`app/game.tsx`)

**Files:**
- Create: `src/components/game/GameHost.tsx`
- Create: `src/app/game.tsx`
- Reference: `src/app/topic/[id].tsx`(화면 조합 패턴), `src/theme/tokens.ts`

**Interfaces:**
- Produces:
  - `interface GameProps { onFinish: (score: number) => void }` (GameHost.tsx에서 export)
  - `function GameHost({ gameKey, onFinish }: { gameKey: string } & GameProps)` — key로 종목 컴포넌트 선택
- Consumes(다음 태스크가 채움): `ReactionGame` 등 7개 종목 컴포넌트. Task 5에서는 빈 매핑으로 시작하고 Task 6~12에서 한 줄씩 추가한다.

- [ ] **Step 1: GameHost 작성 (빈 매핑)** — `src/components/game/GameHost.tsx`

```tsx
import type { ComponentType } from 'react';
import { Text, View } from 'react-native';
import { color, typeface } from '@/theme/tokens';

export interface GameProps {
  onFinish: (score: number) => void;
}

/** 종목 key → 컴포넌트. 종목 추가 = 여기 한 줄 + GAME_CATALOG 한 줄 (OCP) */
const GAMES: Record<string, ComponentType<GameProps>> = {
  // Task 6~12에서 채운다
};

export function GameHost({ gameKey, onFinish }: { gameKey: string } & GameProps) {
  const G = GAMES[gameKey];
  if (!G) {
    return (
      <View style={{ padding: 24 }}>
        <Text style={{ fontFamily: typeface, color: color.sub }}>준비 중인 종목이에요</Text>
      </View>
    );
  }
  return <G onFinish={onFinish} />;
}
```

- [ ] **Step 2: 게임 화면 작성** — `src/app/game.tsx`

```tsx
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { color, space, typeface } from '@/theme/tokens';
import { todayKST } from '@/lib/date';
import { pickTodayGame, outcome } from '@/lib/games';
import { useCoupleProfiles } from '@/api/couple';
import { useTodayGameScores, useSubmitRound } from '@/api/games';
import { GameHost } from '@/components/game/GameHost';
import { Meta } from '@/components/Meta';
import { Eyebrow } from '@/components/Eyebrow';

type Phase = 'intro' | 'play' | 'result';

/** 오늘의 게임 — 인트로 → 종목 플레이 → 결과(상대 공개). 3판 소진 후 재진입 시 결과만. */
export default function GameScreen() {
  const router = useRouter();
  const game = pickTodayGame(todayKST());
  const scores = useTodayGameScores();
  const submit = useSubmitRound();
  const profiles = useCoupleProfiles();
  const partnerName = profiles.data?.partner?.nickname || '상대';

  const mine = scores.data?.mine ?? null;
  const attempts = mine?.attempts ?? 0;
  const capped = attempts >= 3;
  const [phase, setPhase] = useState<Phase>('intro');

  if (!scores.data) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={color.sub} />
      </View>
    );
  }

  // 이미 마쳤거나(공개 조건 충족) 3판 소진이면 결과부터
  const showResult = phase === 'result' || capped;

  async function playRound(score: number) {
    await submit.mutateAsync(score);
    setPhase('result'); // 매 판 후 결과 보기(상대 공개). 재도전 버튼으로 다음 판.
  }

  return (
    <ScrollView
      style={{ backgroundColor: color.bg }}
      contentContainerStyle={{ padding: space[4], paddingTop: space[6] }}
    >
      <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginBottom: space[4] }}>
        <Meta>‹ 오늘</Meta>
      </Pressable>

      <Eyebrow>오늘의 게임</Eyebrow>
      <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 24, color: color.white, marginTop: space[1] }}>
        {game.name}
      </Text>
      <Meta style={{ marginTop: space[2] }}>{game.blurb}</Meta>

      {!showResult && phase === 'intro' && (
        <View style={{ marginTop: space[6], alignItems: 'center' }}>
          <Meta>{attempts}/3 판</Meta>
          <Pressable
            onPress={() => setPhase('play')}
            style={({ pressed }) => ({
              marginTop: space[3], paddingHorizontal: space[6], paddingVertical: space[3],
              borderRadius: 999, backgroundColor: pressed ? color.greenPress : color.greenCore,
            })}
          >
            <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 16, color: color.onPrimary }}>
              {attempts === 0 ? '시작' : '다시 도전'}
            </Text>
          </Pressable>
        </View>
      )}

      {!showResult && phase === 'play' && (
        <View style={{ marginTop: space[5] }}>
          <GameHost gameKey={game.key} onFinish={playRound} />
        </View>
      )}

      {showResult && (
        <ResultCard
          game={game}
          mineBest={mine?.bestScore ?? null}
          partnerBest={scores.data.partner?.bestScore ?? null}
          attempts={attempts}
          partnerName={partnerName}
          canRetry={!capped}
          onRetry={() => setPhase('intro')}
        />
      )}
    </ScrollView>
  );
}

function ResultCard({
  game, mineBest, partnerBest, attempts, partnerName, canRetry, onRetry,
}: {
  game: ReturnType<typeof pickTodayGame>;
  mineBest: number | null; partnerBest: number | null;
  attempts: number; partnerName: string; canRetry: boolean; onRetry: () => void;
}) {
  const o = mineBest !== null && partnerBest !== null
    ? outcome(mineBest, partnerBest, game.higherIsBetter) : null;
  const verdict = o === 'win' ? '이기고 있어요' : o === 'lose' ? '지고 있어요' : o === 'draw' ? '동점!' : null;

  return (
    <View style={{ marginTop: space[6], borderRadius: 14, padding: space[5], backgroundColor: color.surface1 }}>
      <Row label="나" value={mineBest !== null ? game.format(mineBest) : '-'} />
      <Row
        label={partnerName}
        value={partnerBest !== null ? game.format(partnerBest)
          : mineBest !== null ? `${partnerName}님을 기다리는 중` : '먼저 한 판 해야 열려요'}
      />
      {verdict && (
        <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 18, color: color.accent, marginTop: space[4] }}>
          {verdict}
        </Text>
      )}
      {canRetry ? (
        <Pressable onPress={onRetry} style={{ marginTop: space[4] }}>
          <Text style={{ fontFamily: typeface, fontWeight: '700', color: color.white }}>
            다시 도전 ({attempts}/3)
          </Text>
        </Pressable>
      ) : (
        <Meta style={{ marginTop: space[4] }}>오늘 3판을 다 썼어요</Meta>
      )}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space[2] }}>
      <Meta>{label}</Meta>
      <Text style={{ fontFamily: typeface, fontWeight: '700', color: color.white }}>{value}</Text>
    </View>
  );
}
```

- [ ] **Step 3: `useCoupleProfiles`가 `coupleId`·`partner`를 주는지 확인**

Run: `grep -n "coupleId\|partner" src/api/couple.ts`
Expected: `coupleId`와 `partner` 필드가 반환 타입에 있음. 없으면(예: `partner`만 있고 `coupleId`는 다른 훅) `useMyCouple` 등 실제 훅명으로 Task 4·5의 참조를 맞춘다.

- [ ] **Step 4: typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/components/game/GameHost.tsx src/app/game.tsx
git commit -m "feat(game): 게임 화면 뼈대 — 인트로·플레이·결과(상대 공개) + GameHost"
```

---

### Task 6: 반응속도 종목 (`reaction`)

**Files:**
- Create: `src/components/game/games/ReactionGame.tsx`
- Modify: `src/components/game/GameHost.tsx` (매핑 한 줄)

**Interfaces:**
- Consumes: `GameProps` from `../GameHost`.
- Produces: `ReactionGame` (default export). 점수 = 5회 반응시간 평균 ms(낮을수록 승).

- [ ] **Step 1: 구현** — `src/components/game/games/ReactionGame.tsx`

```tsx
import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { color, space, typeface } from '@/theme/tokens';
import type { GameProps } from '../GameHost';

const ROUNDS = 5;

/** 초록으로 바뀌면 탭. 5회 평균 ms. 초록 전에 누르면 그 회차는 페널티(1000ms). */
export default function ReactionGame({ onFinish }: GameProps) {
  const [state, setState] = useState<'wait' | 'ready' | 'now'>('wait');
  const [times, setTimes] = useState<number[]>([]);
  const shownAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function arm() {
    setState('ready');
    const delay = 1200 + Math.floor((times.length * 137 + 500) % 1800); // 의사난수(라운드마다 다름)
    timer.current = setTimeout(() => {
      shownAt.current = Date.now();
      setState('now');
    }, delay);
  }

  function tap() {
    if (state === 'wait') { arm(); return; }
    if (state === 'ready') { // 성급한 탭 = 페널티
      if (timer.current) clearTimeout(timer.current);
      record(1000);
      return;
    }
    record(Date.now() - shownAt.current);
  }

  function record(ms: number) {
    const next = [...times, ms];
    setTimes(next);
    if (next.length >= ROUNDS) {
      onFinish(Math.round(next.reduce((a, b) => a + b, 0) / next.length));
      return;
    }
    setState('wait');
  }

  const bg = state === 'now' ? color.greenCore : state === 'ready' ? color.danger : color.surface2;
  const label = state === 'now' ? '지금!' : state === 'ready' ? '기다려…' : `탭해서 시작 (${times.length + 1}/${ROUNDS})`;

  return (
    <Pressable
      onPress={tap}
      style={{ height: 300, borderRadius: 16, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 22, color: color.white }}>{label}</Text>
      {times.length > 0 && (
        <Text style={{ fontFamily: typeface, color: color.white, marginTop: space[3] }}>
          {times[times.length - 1]}ms
        </Text>
      )}
    </Pressable>
  );
}
```

- [ ] **Step 2: GameHost 매핑 추가** — `src/components/game/GameHost.tsx`

import 추가: `import ReactionGame from './games/ReactionGame';`
`GAMES` 매핑에 추가: `reaction: ReactionGame,`

- [ ] **Step 3: typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: 수동 확인**

시뮬레이터에서 홈(Task 13 후) 또는 임시로 `/game` 진입 → 월요일이면 반응속도. 5회 후 평균 ms가 결과로.
(이 시점엔 홈 카드가 없으므로 `router.push('/game')`를 잠시 아무 버튼에 걸거나 Task 13 후 확인.)

- [ ] **Step 5: 커밋**

```bash
git add src/components/game/games/ReactionGame.tsx src/components/game/GameHost.tsx
git commit -m "feat(game): 반응속도 종목"
```

---

### Task 7: 두더지 잡기 종목 (`whack`)

**Files:**
- Create: `src/components/game/games/WhackGame.tsx`
- Modify: `src/components/game/GameHost.tsx`

**Interfaces:**
- Consumes: `GameProps`. Produces: `WhackGame` (default). 점수 = 15초간 잡은 수(높을수록 승).

- [ ] **Step 1: 구현** — `src/components/game/games/WhackGame.tsx`

```tsx
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { color, space, typeface } from '@/theme/tokens';
import type { GameProps } from '../GameHost';

const DURATION = 15_000;
const CELLS = 9;

/** 3x3 그리드에서 한 칸만 활성. 그 칸을 누르면 +1, 활성 칸은 계속 옮겨다닌다. 15초. */
export default function WhackGame({ onFinish }: GameProps) {
  const [active, setActive] = useState(0);
  const [hits, setHits] = useState(0);
  const [left, setLeft] = useState(DURATION);
  const step = useRef(0);

  useEffect(() => {
    const hop = setInterval(() => {
      step.current += 1;
      setActive((step.current * 7 + 3) % CELLS); // 결정적 이동
    }, 700);
    const tick = setInterval(() => setLeft((l) => Math.max(0, l - 100)), 100);
    const end = setTimeout(() => { clearInterval(hop); clearInterval(tick); onFinish(hits); }, DURATION);
    return () => { clearInterval(hop); clearInterval(tick); clearTimeout(end); };
    // hits는 onFinish 시점 최신값이 필요 → ref로 읽지 않고 아래 tap에서 setHits로만 갱신, end에서 최신 hits 접근 위해 함수형 처리
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // onFinish에 최신 hits를 넘기기 위해 종료를 hits 변화와 분리하지 않고, 종료 시 함수형 업데이트로 캡처
  const finishedRef = useRef(false);
  useEffect(() => {
    if (left === 0 && !finishedRef.current) { finishedRef.current = true; onFinish(hits); }
  }, [left, hits, onFinish]);

  return (
    <View>
      <Text style={{ fontFamily: typeface, color: color.sub, textAlign: 'center' }}>
        {(left / 1000).toFixed(1)}초 · {hits}마리
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2], marginTop: space[3], justifyContent: 'center' }}>
        {Array.from({ length: CELLS }, (_, i) => (
          <Pressable
            key={i}
            onPress={() => { if (i === active && left > 0) setHits((h) => h + 1); }}
            style={{
              width: 92, height: 92, borderRadius: 12,
              backgroundColor: i === active ? color.greenCore : color.surface2,
            }}
          />
        ))}
      </View>
    </View>
  );
}
```

Note: 위 코드는 `end` setTimeout과 `left===0` effect가 이중 종료를 부를 수 있다. **정리:** `end`
setTimeout의 `onFinish(hits)` 줄을 지우고(클로저가 낡은 hits를 캡처함), 종료는 `finishedRef` +
`left===0` effect 한 곳만 담당하게 둔다. 첫 `useEffect`는 타이머 setup/정리만 하도록 남긴다.

- [ ] **Step 2: 위 Note대로 종료 경로 단일화** — 첫 `useEffect`의 `end` 콜백에서 `onFinish(hits)` 제거.

- [ ] **Step 3: GameHost 매핑** — `import WhackGame from './games/WhackGame';` + `whack: WhackGame,`

- [ ] **Step 4: typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/components/game/games/WhackGame.tsx src/components/game/GameHost.tsx
git commit -m "feat(game): 두더지 잡기 종목"
```

---

### Task 8: 색 다른 칸 찾기 종목 (`oddcolor`)

**Files:**
- Create: `src/components/game/games/OddColorGame.tsx`
- Modify: `src/components/game/GameHost.tsx`

**Interfaces:**
- Consumes: `GameProps`. Produces: `OddColorGame` (default). 점수 = 도달 단계(높을수록 승). 단계마다 그리드↑·색차↓, 오답이면 종료.

- [ ] **Step 1: 구현** — `src/components/game/games/OddColorGame.tsx`

```tsx
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { color, space, typeface } from '@/theme/tokens';
import type { GameProps } from '../GameHost';

/** 단계 n: (n+1)x(n+1) 그리드 중 한 칸만 살짝 다른 명도. 맞히면 다음 단계, 틀리면 종료(점수=n). */
export default function OddColorGame({ onFinish }: GameProps) {
  const [level, setLevel] = useState(1);

  const cols = Math.min(2 + Math.floor(level / 2), 6);
  const count = cols * cols;
  const diff = Math.max(6, 60 - level * 4); // 명도차(작을수록 어려움)
  const base = 60;
  const odd = (level * 13 + 7) % count; // 결정적 위치
  const baseColor = `hsl(210, 12%, ${base}%)`;
  const oddColor = `hsl(210, 12%, ${base - diff / 3}%)`;

  function pick(i: number) {
    if (i === odd) setLevel((l) => l + 1);
    else onFinish(level - 1); // 도달 단계 = 마지막으로 맞힌 단계
  }

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontFamily: typeface, fontWeight: '700', color: color.white }}>{level}단계</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: cols * 56, marginTop: space[3], gap: 4, justifyContent: 'center' }}>
        {Array.from({ length: count }, (_, i) => (
          <Pressable
            key={i}
            onPress={() => pick(i)}
            style={{ width: 52, height: 52, borderRadius: 8, backgroundColor: i === odd ? oddColor : baseColor }}
          />
        ))}
      </View>
    </View>
  );
}
```

- [ ] **Step 2: GameHost 매핑** — `import OddColorGame from './games/OddColorGame';` + `oddcolor: OddColorGame,`

- [ ] **Step 3: typecheck** — Run: `npm run typecheck` → PASS

- [ ] **Step 4: 커밋**

```bash
git add src/components/game/games/OddColorGame.tsx src/components/game/GameHost.tsx
git commit -m "feat(game): 색 다른 칸 찾기 종목"
```

---

### Task 9: 정확히 10초 종목 (`tensec`)

**Files:**
- Create: `src/components/game/games/TenSecGame.tsx`
- Modify: `src/components/game/GameHost.tsx`

**Interfaces:**
- Consumes: `GameProps`. Produces: `TenSecGame` (default). 점수 = |경과 - 10000| ms 오차(낮을수록 승).

- [ ] **Step 1: 구현** — `src/components/game/games/TenSecGame.tsx`

```tsx
import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { color, space, typeface } from '@/theme/tokens';
import type { GameProps } from '../GameHost';

/** 시작을 누른 뒤 타이머를 숨긴 채 10.000초에 맞춰 정지. 점수 = 오차(ms). */
export default function TenSecGame({ onFinish }: GameProps) {
  const [running, setRunning] = useState(false);
  const startedAt = useRef(0);

  function toggle() {
    if (!running) { startedAt.current = Date.now(); setRunning(true); return; }
    onFinish(Math.abs(Date.now() - startedAt.current - 10_000));
  }

  return (
    <Pressable
      onPress={toggle}
      style={{ height: 300, borderRadius: 16, backgroundColor: running ? color.surface3 : color.surface2, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 22, color: color.white }}>
        {running ? '지금! (10초에 맞춰 탭)' : '탭하면 시작 — 타이머는 숨겨져요'}
      </Text>
      <Text style={{ fontFamily: typeface, color: color.sub, marginTop: space[3] }}>
        {running ? '' : '10.000초에 정지하세요'}
      </Text>
    </Pressable>
  );
}
```

- [ ] **Step 2: GameHost 매핑** — `import TenSecGame from './games/TenSecGame';` + `tensec: TenSecGame,`

- [ ] **Step 3: typecheck** → PASS

- [ ] **Step 4: 커밋**

```bash
git add src/components/game/games/TenSecGame.tsx src/components/game/GameHost.tsx
git commit -m "feat(game): 정확히 10초 종목"
```

---

### Task 10: 탭 연타 종목 (`taprush`)

**Files:**
- Create: `src/components/game/games/TapRushGame.tsx`
- Modify: `src/components/game/GameHost.tsx`

**Interfaces:**
- Consumes: `GameProps`. Produces: `TapRushGame` (default). 점수 = 10초간 탭 수(높을수록 승).

- [ ] **Step 1: 구현** — `src/components/game/games/TapRushGame.tsx`

```tsx
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { color, space, typeface } from '@/theme/tokens';
import type { GameProps } from '../GameHost';

const DURATION = 10_000;

/** 시작 후 10초 동안 최대한 많이 탭. 점수 = 탭 수. */
export default function TapRushGame({ onFinish }: GameProps) {
  const [started, setStarted] = useState(false);
  const [taps, setTaps] = useState(0);
  const [left, setLeft] = useState(DURATION);
  const done = useRef(false);

  useEffect(() => {
    if (!started) return;
    const tick = setInterval(() => setLeft((l) => Math.max(0, l - 100)), 100);
    return () => clearInterval(tick);
  }, [started]);

  useEffect(() => {
    if (started && left === 0 && !done.current) { done.current = true; onFinish(taps); }
  }, [started, left, taps, onFinish]);

  return (
    <Pressable
      onPress={() => { if (!started) { setStarted(true); setTaps(1); } else if (left > 0) setTaps((t) => t + 1); }}
      style={{ height: 300, borderRadius: 16, backgroundColor: color.greenCore, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 40, color: color.onPrimary }}>{taps}</Text>
      <Text style={{ fontFamily: typeface, color: color.onPrimary, marginTop: space[2] }}>
        {started ? `${(left / 1000).toFixed(1)}초` : '탭해서 시작 — 10초 연타!'}
      </Text>
    </Pressable>
  );
}
```

- [ ] **Step 2: GameHost 매핑** — `import TapRushGame from './games/TapRushGame';` + `taprush: TapRushGame,`

- [ ] **Step 3: typecheck** → PASS

- [ ] **Step 4: 커밋**

```bash
git add src/components/game/games/TapRushGame.tsx src/components/game/GameHost.tsx
git commit -m "feat(game): 탭 연타 종목"
```

---

### Task 11: 글자색 고르기 종목 (`stroop`)

**Files:**
- Create: `src/components/game/games/StroopGame.tsx`
- Modify: `src/components/game/GameHost.tsx`

**Interfaces:**
- Consumes: `GameProps`. Produces: `StroopGame` (default). 점수 = 30초간 맞힌 수(높을수록 승). 오답은 시간 페널티 없이 다음 문제로(카운트 안 함).

- [ ] **Step 1: 구현** — `src/components/game/games/StroopGame.tsx`

```tsx
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { color, space, typeface } from '@/theme/tokens';
import type { GameProps } from '../GameHost';

const DURATION = 30_000;
const WORDS = [
  { label: '빨강', key: 'red', hex: color.holiday },
  { label: '초록', key: 'green', hex: color.accent },
  { label: '파랑', key: 'blue', hex: color.saturday },
  { label: '노랑', key: 'yellow', hex: color.anniv },
];

/** 글자의 뜻이 아니라 '글자색'을 고른다. 30초간 맞힌 수. */
export default function StroopGame({ onFinish }: GameProps) {
  const [n, setN] = useState(0);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(DURATION);
  const done = useRef(false);

  // 결정적 문제 생성: 글자(word)와 글자색(ink)이 대체로 어긋나게
  const word = WORDS[n % WORDS.length];
  const ink = WORDS[(n * 3 + 1) % WORDS.length];

  useEffect(() => {
    const tick = setInterval(() => setLeft((l) => Math.max(0, l - 100)), 100);
    return () => clearInterval(tick);
  }, []);
  useEffect(() => {
    if (left === 0 && !done.current) { done.current = true; onFinish(score); }
  }, [left, score, onFinish]);

  function choose(key: string) {
    if (left === 0) return;
    if (key === ink.key) setScore((s) => s + 1);
    setN((v) => v + 1);
  }

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontFamily: typeface, color: color.sub }}>{(left / 1000).toFixed(0)}초 · {score}개</Text>
      <Text style={{ fontFamily: typeface, fontWeight: '900', fontSize: 56, color: ink.hex, marginVertical: space[5] }}>
        {word.label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2], justifyContent: 'center' }}>
        {WORDS.map((w) => (
          <Pressable
            key={w.key}
            onPress={() => choose(w.key)}
            style={{ paddingHorizontal: space[5], paddingVertical: space[3], borderRadius: 10, backgroundColor: color.surface2 }}
          >
            <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 18, color: color.white }}>{w.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
```

- [ ] **Step 2: GameHost 매핑** — `import StroopGame from './games/StroopGame';` + `stroop: StroopGame,`

- [ ] **Step 3: typecheck** → PASS

- [ ] **Step 4: 커밋**

```bash
git add src/components/game/games/StroopGame.tsx src/components/game/GameHost.tsx
git commit -m "feat(game): 글자색 고르기(스트룹) 종목"
```

---

### Task 12: 숫자 순서 탭 종목 (`sequence`)

**Files:**
- Create: `src/components/game/games/SequenceGame.tsx`
- Modify: `src/components/game/GameHost.tsx`

**Interfaces:**
- Consumes: `GameProps`. Produces: `SequenceGame` (default). 점수 = 1~25 완주 시간 ms(낮을수록 승). 첫 탭에 타이머 시작.

- [ ] **Step 1: 구현** — `src/components/game/games/SequenceGame.tsx`

```tsx
import { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { color, space, typeface } from '@/theme/tokens';
import type { GameProps } from '../GameHost';

const N = 25;

/** 흩어진 1~25를 순서대로. 1을 누르면 타이머 시작, 25에서 종료. 점수 = 걸린 시간(ms). */
export default function SequenceGame({ onFinish }: GameProps) {
  // 결정적 셔플(마운트당 고정) — Math.random 미사용
  const layout = useMemo(() => {
    const arr = Array.from({ length: N }, (_, i) => i + 1);
    for (let i = N - 1; i > 0; i--) {
      const j = (i * 17 + 5) % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, []);
  const [next, setNext] = useState(1);
  const startedAt = useRef(0);

  function tap(v: number) {
    if (v !== next) return;
    if (v === 1) startedAt.current = Date.now();
    if (v === N) { onFinish(Date.now() - startedAt.current); return; }
    setNext(v + 1);
  }

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontFamily: typeface, color: color.sub }}>다음: {next}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 5 * 60, marginTop: space[3], justifyContent: 'center' }}>
        {layout.map((v) => (
          <Pressable
            key={v}
            onPress={() => tap(v)}
            style={{ width: 56, height: 56, margin: 2, borderRadius: 8,
              backgroundColor: v < next ? color.surface1 : color.surface3, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontFamily: typeface, fontWeight: '700', color: v < next ? color.muted : color.white }}>{v}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
```

- [ ] **Step 2: GameHost 매핑** — `import SequenceGame from './games/SequenceGame';` + `sequence: SequenceGame,`

- [ ] **Step 3: typecheck** → PASS

- [ ] **Step 4: 커밋**

```bash
git add src/components/game/games/SequenceGame.tsx src/components/game/GameHost.tsx
git commit -m "feat(game): 숫자 순서 탭 종목"
```

---

### Task 13: 홈 카드 + 라우팅 (`GameCard` + home)

**Files:**
- Create: `src/components/game/GameCard.tsx`
- Modify: `src/app/(tabs)/home/index.tsx` (주제 카드 아래에 배치)

**Interfaces:**
- Consumes: `useTodayGameScores`, `useWeekOutcomes` from `@/api/games`; `pickTodayGame`, `tally` from `@/lib/games`; `todayKST`.
- Produces: `GameCard` (props-only) — `{ gameName, myBest, partnerState, record, onPress }`.

- [ ] **Step 1: GameCard 작성 (props-only)** — `src/components/game/GameCard.tsx`

```tsx
import { Pressable, Text, View } from 'react-native';
import { color, space, typeface } from '@/theme/tokens';
import { Eyebrow } from '@/components/Eyebrow';
import { Meta } from '@/components/Meta';

export function GameCard({
  gameName, myBest, partnerState, record, onPress,
}: {
  gameName: string;
  myBest: string | null;         // 포맷된 내 최고점 (없으면 null)
  partnerState: string;          // '잠김' 대신 표시 문구 ('b님 기다리는 중' 등)
  record: string;                // '3승 1무 2패'
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        marginTop: space[5], borderRadius: 14, padding: space[4],
        backgroundColor: color.surface1, opacity: pressed ? 0.9 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Eyebrow>오늘의 게임</Eyebrow>
        <Meta>{record}</Meta>
      </View>
      <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 16, color: color.white, marginTop: space[2] }}>
        {gameName}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space[2] }}>
        <Meta>{myBest ? `내 최고 ${myBest}` : '아직 안 했어요 — 눌러서 시작'}</Meta>
        <Meta>{partnerState}</Meta>
      </View>
    </Pressable>
  );
}
```

- [ ] **Step 2: 홈에 배치** — `src/app/(tabs)/home/index.tsx`

import 추가:
```tsx
import { GameCard } from '@/components/game/GameCard';
import { useTodayGameScores, useWeekOutcomes } from '@/api/games';
import { pickTodayGame, tally } from '@/lib/games';
```

`Today()` 본문에 훅 추가(다른 훅들 옆):
```tsx
  const game = pickTodayGame(today); // today는 이미 컴포넌트에 있음. 없으면 todayKST() 사용
  const gameScores = useTodayGameScores();
  const week = useWeekOutcomes();
```

주제 카드 `</Pressable>` 바로 다음, `</ScrollView>` 전에:
```tsx
      <GameCard
        gameName={game.name}
        myBest={gameScores.data?.mine ? game.format(gameScores.data.mine.bestScore) : null}
        partnerState={
          !gameScores.data?.mine
            ? '내가 해야 열려요'
            : gameScores.data.partner
              ? `${partnerName} ${game.format(gameScores.data.partner.bestScore)}`
              : `${partnerName}님 대기`
        }
        record={(() => {
          const t = tally(week.data ?? []);
          return `${t.win}승 ${t.draw}무 ${t.lose}패`;
        })()}
        onPress={() => router.push('/game')}
      />
```

주의: `today`가 `Today()` 안에서 `topic.data` 가드 뒤에 선언돼 있다. `game`은 `today` 선언 이후에
둬야 한다. 훅(`useTodayGameScores` 등)은 조건부 return보다 **위**(최상단)에서 호출해야 Rules of
Hooks를 지킨다 — 훅 호출은 상단에, `game = pickTodayGame(today)` 파생값만 `today` 아래에 둔다.

- [ ] **Step 3: typecheck + test**

Run: `npm run typecheck && npm test`
Expected: PASS

- [ ] **Step 4: 시뮬레이터 수동 확인**

`xcrun simctl io booted screenshot` 로 홈에 게임 카드가 보이는지, 눌러서 `/game` 진입·3판·결과
공개까지 확인. (오늘 요일에 해당하는 종목이 뜬다.)

- [ ] **Step 5: 커밋**

```bash
git add src/components/game/GameCard.tsx "src/app/(tabs)/home/index.tsx"
git commit -m "feat(game): 홈 '오늘의 게임' 카드 + /game 진입"
```

---

### Task 14: 상대 완료 푸시 (`notify-game` Edge Function)

**Files:**
- Create: `supabase/functions/notify-game/index.ts`
- Reference: `supabase/functions/daily-release/index.ts`(exp.host 발송 패턴), `supabase/functions/_shared/`

**Interfaces:**
- Consumes: 호출자 세션(Authorization 헤더). `submit_game_round` 첫 완료 시 `useSubmitRound`가 invoke.
- Produces: 상대에게 푸시 1건. 반환은 `{ pushed: number }`.

- [ ] **Step 1: `_shared` 헬퍼·발송 형식 확인**

Run: `ls supabase/functions/_shared && sed -n '1,30p' supabase/functions/daily-release/index.ts`
Expected: CORS/JSON 헬퍼와 exp.host POST 형식 확인. 그 형식을 그대로 따른다.

- [ ] **Step 2: 함수 작성** — `supabase/functions/notify-game/index.ts`

```ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization') ?? '';
  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // 호출자(=방금 마친 사람) 식별
  const asUser = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const { data: me } = await asUser.auth.getUser();
  const meId = me.user?.id;
  if (!meId) return new Response(JSON.stringify({ pushed: 0 }), { status: 401 });

  const admin = createClient(url, service);

  // 내 커플·닉네임, 상대 push_token 조회
  const { data: myProfile } = await admin.from('profiles').select('nickname, couple_id').eq('id', meId).single();
  if (!myProfile?.couple_id) return new Response(JSON.stringify({ pushed: 0 }));
  const { data: members } = await admin
    .from('couple_members').select('user_id').eq('couple_id', myProfile.couple_id);
  const partnerId = (members ?? []).map((m) => m.user_id).find((id) => id !== meId);
  if (!partnerId) return new Response(JSON.stringify({ pushed: 0 }));
  const { data: partner } = await admin.from('profiles').select('push_token').eq('id', partnerId).single();
  const token = partner?.push_token;
  if (!token) return new Response(JSON.stringify({ pushed: 0 }));

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([{
      to: token, sound: 'default',
      title: '오늘의 게임', body: `${myProfile.nickname ?? '상대'}님이 오늘의 게임을 마쳤어요`,
      data: { route: '/game' },
    }]),
  });
  return new Response(JSON.stringify({ pushed: 1 }), { headers: { 'Content-Type': 'application/json' } });
});
```

Note: `profiles`의 실제 커플 참조 컬럼명(`couple_id` 유무)과 `couple_members` 테이블 구조를 Step 1에서
확인해 맞춘다. `my_couple_id()` SQL과 동일한 관계를 admin 클라이언트로 재현하는 것이 목적이다.

- [ ] **Step 3: 로컬 서브 배포·구동 확인 (선택)**

Run: `npx supabase functions serve notify-game`
Expected: 부팅 에러 없음. (실기기 토큰이 없으면 `pushed:0`가 정상)

- [ ] **Step 4: 원격 배포**

Run: `npx supabase functions deploy notify-game`
Expected: 배포 성공. (시크릿 `SUPABASE_*`는 플랫폼 기본 제공)

- [ ] **Step 5: typecheck (클라이언트) + 커밋**

Run: `npm run typecheck`
Expected: PASS (클라이언트 쪽 `supabase.functions.invoke('notify-game')`는 Task 4에서 이미 연결됨)

```bash
git add supabase/functions/notify-game/index.ts
git commit -m "feat(game): 상대 완료 시 푸시(notify-game Edge Function)"
```

---

## 마무리 체크

- [ ] `npm run typecheck` PASS
- [ ] `npm test` PASS (games 테스트 포함 전체)
- [ ] 시뮬레이터: 홈 카드 → `/game` → 3판 → 결과 공개 → 3판 소진 후 재진입 시 결과만
- [ ] `git push` (main)

## 배포 후 수동 설정

- 없음. `notify-game`은 기존 Expo 발송 경로만 쓰므로 새 시크릿이 필요 없다.
- 원격 반영: 구현 세션에서 `npx supabase db push`(마이그레이션) + `functions deploy notify-game` +
  타입 재생성이 코드와 같은 커밋에 포함됐는지 확인.

# 커플 아케이드 (Couple Arcade) 설계

- 날짜: 2026-07-27
- 상태: 설계 확정 (구현 전)
- 자리: **오늘** 탭. 추천곡·주제 카드와 나란한 작은 카드 하나가 진입구. 실제 게임은 `/game` 화면.

## 1. 콘셉트

**하루 한 종목, 각자 혼자 30초 플레이해서 점수로 승부.** 종목은 KST 날짜로 자동 배정돼
매일 바뀌고(요일 고정), 하루 **3판까지 시도해 그중 최고 기록**이 그날의 내 점수가 된다.
**내가 한 판이라도 마쳐야 상대 점수가 열린다** — 상대 기록에 맞춰 조절하는 걸 막고, 여는 순간을
반전으로 만든다. '오늘의 주제'와 같은 문법이다.

목적은 **"같이 노는 재미"**. 솔로로 성립하니 접속 타이밍이 안 맞아도 죽지 않고, 점수가 있으니
재도전 욕구가 생기고, 이번 주 전적이 쌓이니 매일 열 이유가 덤으로 남는다.
다른 탭(캘린더·플레이리스트·피드)의 일과 겹치지 않는다.

## 2. 범위

**0.1 포함**
- 종목 7개 (요일 고정, 게임엔진 없이 타이머 + `Pressable`로 구현)
- 하루 한 종목 **결정론적 배정** (`epochDay % 7`)
- 3판 시도 · 최고 기록 인정 · 서버가 4번째 판을 무시(3판 상한)
- **공개 규칙**: 내가 마치기 전엔 상대 점수 가림 (RLS 강제)
- 홈 카드: 오늘의 종목 · 내 최고점 · 상대 자리 · 이번 주 전적(승/무/패)
- `/game` 화면: 인트로 → 종목 플레이 → 결과(상대 공개)
- 상대 완료 시 푸시 1건 ("b님이 오늘의 게임을 마쳤어요")
- Realtime: 상대가 마치면 홈 카드가 즉시 열림

**보류 (비목표)**
- 둘 다 접속 중일 때의 실시간 동시 대결 연출 — 솔로/비동기로 충분, 이후 마일스톤
- 시즌·리그·랭킹, 종목별 개인 통계 그래프
- 종목 추가용 관리 UI (종목은 코드 카탈로그로만 정의)
- 무승부·승패에 따른 보상/뱃지

## 3. 종목 카탈로그 (7종)

`epochDay % 7`이 카탈로그 인덱스라 요일에 고정된다. 종목마다 점수 방향(`higherIsBetter`)과
표시 형식이 다르므로 **원점수를 그대로 저장**하고 비교·표시는 종목 메타로 한다.

| idx | 요일 | key | 종목 | 하는 법 | 점수(unit) | 방향 |
|---|---|---|---|---|---|---|
| 0 | 월 | `reaction` | 반응속도 | 초록으로 바뀌는 순간 탭 (5회) | 평균 ms | 낮을수록 승 |
| 1 | 화 | `whack` | 두더지 잡기 | 15초, 튀어나오는 칸 탭 | 잡은 수 | 높을수록 승 |
| 2 | 수 | `oddcolor` | 색 다른 칸 찾기 | 딱 하나 다른 색 탭, 단계마다 색차↓ | 도달 단계 | 높을수록 승 |
| 3 | 목 | `tensec` | 정확히 10초 | 타이머 숨긴 채 10.000초에 정지 | 오차 ms | 낮을수록 승 |
| 4 | 금 | `taprush` | 탭 연타 | 10초 동안 몇 번 누르나 | 탭 수 | 높을수록 승 |
| 5 | 토 | `stroop` | 글자색 고르기 | "빨강"이 파란 글씨 → **글자색** 선택, 30초 | 맞힌 수 | 높을수록 승 |
| 6 | 일 | `sequence` | 숫자 순서 탭 | 흩어진 1~25를 순서대로 | 걸린 시간 ms | 낮을수록 승 |

`idx 0 = 월요일`이 되도록 카탈로그 순서를 고정한다. (검증은 `pickTodayGame`가 아니라 카탈로그
배열 순서에 달렸다 — 요일 매핑은 테스트로 못박는다.)

## 4. 데이터 모델

### 테이블 `game_scores` (커플당 하루 두 행: 나·상대)

```sql
create table public.game_scores (
  couple_id uuid not null references public.couples (id) on delete cascade,
  game_date date not null,                    -- KST 날짜 (클라이언트가 todayKST()로 채운다)
  user_id uuid not null references auth.users (id) on delete cascade,
  game_key text not null,                     -- 그날의 종목 key (분석·안전용, 날짜에서 파생 가능)
  best_score numeric not null,                -- 원점수. 방향은 higher_is_better로 해석
  attempts integer not null default 1 check (attempts between 1 and 3),
  higher_is_better boolean not null,          -- 종목 메타 (best 계산을 서버가 방향 모르고 할 수 있게)
  updated_at timestamptz not null default now(),
  primary key (couple_id, game_date, user_id)
);
create index game_scores_week_idx on public.game_scores (couple_id, game_date);
```

### 한 판 제출 = RPC (서버가 best·상한을 강제)

증분(`attempts+1`)과 `where attempts < 3`은 Supabase JS `.upsert()`(전체 덮어쓰기)로 표현할 수 없어
`security definer` 함수 `submit_game_round`로 감싼다. 방향은 저장된 `higher_is_better`로 판단.

```sql
create or replace function public.submit_game_round(
  p_game_key text, p_score numeric, p_higher_is_better boolean, p_date date
) returns public.game_scores
language plpgsql security definer set search_path = public as $$
declare result public.game_scores; cid uuid := public.my_couple_id();
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
  where game_scores.attempts < 3   -- 4번째 판은 0행 → 조용히 무시 (3판 상한 공짜)
  returning * into result;
  return result; -- 3판 도달 시 null
end; $$;
```

3판을 다 쓰면 update가 0행이 되어 `null`을 반환한다. 클라이언트는 반환된 `attempts`로
"n/3"을 표시하고, `null`이면(=상한 도달) 결과 화면으로 보낸다.

### RLS — "내가 해야 열린다"를 서버가 강제

`topics`의 `has_voted` 패턴을 그대로 복제한다. 클라이언트에서 가리면 쿼리 한 번에 뚫리므로 RLS로 막는다.

```sql
-- 내가 오늘 한 판이라도 냈는가 (security definer로 정책 재귀 회피)
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
-- upsert의 on conflict update 경로용. 내 행만.
create policy "game_scores_update" on public.game_scores for update
  using (couple_id = public.my_couple_id() and user_id = auth.uid())
  with check (couple_id = public.my_couple_id() and user_id = auth.uid());

alter publication supabase_realtime add table public.game_scores;
grant select, insert, update, delete on public.game_scores to anon, authenticated, service_role;
grant execute on function public.has_played(date) to anon, authenticated, service_role;
```

주의: `has_played`는 `game_date` 기준이라 "오늘 상대 점수 공개"가 날짜 단위로 정확히 닫힌다.
어제 마쳤다고 오늘 상대 점수가 열리지 않는다.

## 5. 도메인 규칙 — `src/lib/games.ts` (순수 함수, 유일한 테스트 대상)

React·Supabase·RN import 없음. `lib/date.ts`의 `toEpochDay`·`todayKST`만 사용.

```ts
export interface GameDef {
  key: string;
  name: string;              // "반응속도"
  blurb: string;             // 인트로 한 줄 설명
  unit: 'ms' | 'count' | 'level';
  higherIsBetter: boolean;
  format: (score: number) => string;   // 218 → "218ms", 12 → "12개", 7 → "7단계"
}

export const GAME_CATALOG: GameDef[];                 // 길이 7, idx 0 = 월
export function pickTodayGame(today: ISODate): GameDef // epochDay % 7 (추천곡·주제와 동형)
export type Outcome = 'win' | 'lose' | 'draw';
export function outcome(mine: number, theirs: number, higherIsBetter: boolean): Outcome
export function weekBounds(today: ISODate): { start: ISODate; end: ISODate } // 월~일 KST
export interface WeekTally { win: number; draw: number; lose: number }
export function tally(rows: DailyResult[]): WeekTally // 양쪽 다 낸 날만 집계
```

- `outcome`: 동점 = `draw`. 방향은 인자로 받아 종목마다 다른 대소를 흡수한다.
- `tally`: **양쪽 다 점수를 낸 날만** 승/무/패에 넣는다(한쪽만 한 날은 승부 없음).
- 전적 주간 경계는 월요일 00:00 ~ 일요일 24:00 (KST).

## 6. 화면·컴포넌트 (방향: `app → components → api/lib`)

- **`components/game/GameCard.tsx`** (props-only) — 홈의 작은 카드.
  입력: 오늘 종목 이름, 내 최고점(포맷 문자열|null), 상대 상태(`잠김·기다리는 중·마침`),
  주간 전적. 누르면 `onPress`(→ `/game`).
- **`components/game/games/*.tsx`** — 종목 7개. 공통 인터페이스 `{ onFinish(score: number): void }`.
  각자 자기 타이머·상태만 들고 표현만 한다(SRP). 점수 규칙·비교는 들지 않는다.
- **`components/game/GameHost.tsx`** — `game_key`로 알맞은 종목 컴포넌트를 고르는 스위치(OCP: 종목
  추가 = 카탈로그 + 여기 한 줄).
- **`src/app/game.tsx`** — 조합만. `useTodayGameScores` + `useSubmitRound` 호출, 인트로 → `GameHost`
  → 결과(상대 공개) 상태를 오간다. 3판 소진 후 재진입 시 결과만.
- **`src/app/(tabs)/home/index.tsx`** — 주제 카드 아래에 `GameCard` 배치.

## 7. 데이터 훅 — `src/api/games.ts`

- `useTodayGameScores()` → `{ mine: Score|null, partner: Score|null }`.
  partner는 RLS 때문에 내가 마치기 전엔 항상 null로 온다(클라이언트가 추가로 가릴 필요 없음).
- `useWeekOutcomes()` → 이번 주 `DailyResult[]` (양쪽 점수를 조인해 `tally`에 넘길 형태로 가공).
- `useSubmitRound()` → `submit_game_round` RPC(§4). 성공 시 `game_scores` 쿼리 무효화. 반환 `attempts`로 n/3 판단.
- **첫 완료 시 푸시**: `attempts === 1`(그날 첫 행)일 때만 Edge Function `notify-game`를 호출.

## 8. 푸시 — Edge Function `notify-game`

기존 발송 패턴(`daily-release`가 `profiles.push_token`으로 `exp.host`에 POST)을 그대로 쓴다.

- 입력: 없음(호출자 세션). service role로 **상대**의 `push_token`을 찾아 1건 발송.
- 문구: "{내 닉네임}님이 오늘의 게임을 마쳤어요" — 열어서 대결을 확인하라는 고리.
- 실패는 조용히 무시(추천곡·주제와 동일). 푸시는 부가물이지 게임 성립 조건이 아니다.
- 시크릿 추가 없음(이미 있는 Expo 발송 경로 재사용).

## 9. 검증 (Goal-Driven)

- **lib 단위 테스트** (`src/lib/__tests__/games.test.ts`):
  - `pickTodayGame`: 같은 날 같은 종목 / 하루 지나면 다음 idx / 7일 순환 / idx 0 = 월요일 매핑
  - `outcome`: 높을수록/낮을수록 각각 win·lose·draw
  - `tally`: 한쪽만 한 날 제외, 승/무/패 집계, 주간 경계
- **RLS 동치**: "상대 점수는 내가 마쳐야 열린다"를 `has_played` 경로로 확인(주제의 검증 방식 준용).
- **수동**: 시뮬레이터에서 홈 카드 → `/game` → 3판 → 결과 공개, 3판 소진 후 재진입 시 결과만.

## 10. 규칙 준수 메모

- 모든 색상 토큰 참조, 날짜는 `lib/date.ts` 경유(KST 고정) — `game_date`·주간 경계·`epochDay`.
- 비즈니스 규칙은 `lib/games.ts`에만. 컴포넌트는 props-only, 화면은 조합만. Supabase 접근은 `api/`로만.
- 마이그레이션은 코드와 같은 커밋. 원격 적용(`db push`) + 타입 재생성은 구현 세션에서.

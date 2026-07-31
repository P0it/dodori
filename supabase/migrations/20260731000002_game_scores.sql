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

-- 내가 그날(p_date) 한 판이라도 냈는가. 정책 재귀 회피 위해 security definer.
create or replace function public.has_played(p_date date)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.game_scores
    where game_date = p_date and user_id = auth.uid() and couple_id = public.my_couple_id()
  )
$$;

alter table public.game_scores enable row level security;

-- 내 행은 항상, 상대 행은 내가 그날 마친 뒤에만
create policy "game_scores_select" on public.game_scores for select using (
  couple_id = public.my_couple_id()
  and (user_id = auth.uid() or public.has_played(game_date))
);
create policy "game_scores_insert" on public.game_scores for insert with check (
  couple_id = public.my_couple_id() and user_id = auth.uid()
);
create policy "game_scores_update" on public.game_scores for update
  using (couple_id = public.my_couple_id() and user_id = auth.uid())
  with check (couple_id = public.my_couple_id() and user_id = auth.uid());

-- 한 판 제출: 첫 판은 insert, 이후는 best 갱신 + attempts+1, 3판 넘으면 무시.
-- Supabase JS의 .upsert()는 전체 덮어쓰기라 attempts+1 증분과 where 조건을 표현할 수 없어 RPC로 감싼다.
-- 반환: 상한 도달(무시)이면 null. 방향(higher_is_better)은 서버가 저장값으로 판단.
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

alter publication supabase_realtime add table public.game_scores;

grant select, insert, update, delete on public.game_scores to anon, authenticated, service_role;
grant execute on function public.has_played(date) to anon, authenticated, service_role;
grant execute on function public.submit_game_round(text, numeric, boolean, date)
  to anon, authenticated, service_role;

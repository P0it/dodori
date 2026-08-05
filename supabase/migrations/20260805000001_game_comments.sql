-- ============================================================
-- game_comments — 그날 게임에 대고 주고받는 말. 하루가 스레드 하나.
-- game_scores를 참조하지 않는다: 그쪽 PK가 사람별 행이라 스레드를 가리킬 부모 행이 없다.
-- 대댓글 없음 (story_comments와 같은 이유 — 둘뿐인 잡담에 층이 생길 이유가 없다).
-- ============================================================

create table public.game_comments (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  game_date date not null,
  author_id uuid not null references auth.users (id),
  body text not null,
  created_at timestamptz not null default now()
);
create index game_comments_day_idx on public.game_comments (couple_id, game_date, created_at);

alter table public.game_comments enable row level security;

-- 점수 정책(game_scores)을 그대로 복제 — 점수를 가려놓고 댓글로 기록이 새어나가면 의미가 없다.
-- has_played가 날짜를 인자로 받으므로 지난 날짜도 같은 함수로 판정된다.
create policy "game_comments_select" on public.game_comments for select using (
  couple_id = public.my_couple_id()
  and (author_id = auth.uid() or public.has_played(game_date))
);
-- 쓰기도 막는다: 그날 한 판도 안 한 사람이 남길 말이 없다
create policy "game_comments_insert" on public.game_comments for insert with check (
  couple_id = public.my_couple_id()
  and author_id = auth.uid()
  and public.has_played(game_date)
);
create policy "game_comments_delete" on public.game_comments for delete
  using (author_id = auth.uid());

alter publication supabase_realtime add table public.game_comments;

grant select, insert, delete on public.game_comments to anon, authenticated, service_role;

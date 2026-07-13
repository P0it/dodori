-- ============================================================
-- 오늘의 대화주제 — 매일 주제 1개 → 각자 투표 → 서로의 답 공개 → 댓글
-- 핵심: "내가 투표해야 상대 답이 열린다"는 RLS로 강제한다 (클라이언트에서 가리면 쿼리 한 번에 뚫림)
-- ============================================================

-- 전역 카탈로그. couple 스코프가 아니다 — 모든 커플이 같은 풀을 seq 순으로 소비한다.
create table public.topics (
  id uuid primary key default gen_random_uuid(),
  seq integer not null unique, -- 배정 순번 (1부터). 커플 생성일 + n일 → n번
  question text not null,
  option_a text not null,
  option_b text not null,
  created_at timestamptz not null default now()
);

create table public.topic_votes (
  couple_id uuid not null references public.couples (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  choice text not null check (choice in ('a', 'b')),
  created_at timestamptz not null default now(),
  primary key (couple_id, topic_id, user_id)
);

create table public.topic_comments (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index topic_comments_idx on public.topic_comments (couple_id, topic_id, created_at);

-- 내가 이 주제에 투표했는가. topic_votes 정책이 topic_votes를 참조하면 무한 재귀 →
-- my_couple_id()와 같은 방식으로 security definer로 회피한다.
create or replace function public.has_voted(p_topic_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.topic_votes
    where topic_id = p_topic_id
      and user_id = auth.uid()
      and couple_id = public.my_couple_id()
  )
$$;

-- ============================================================
-- RLS
-- ============================================================
alter table public.topics enable row level security;
alter table public.topic_votes enable row level security;
alter table public.topic_comments enable row level security;

-- topics: 인증 유저 전체 읽기. 쓰기 없음 (시드는 마이그레이션으로만).
create policy "topics_select" on public.topics for select to authenticated using (true);

-- topic_votes: 내 표는 항상, 상대 표는 내가 투표한 뒤에만.
create policy "topic_votes_select" on public.topic_votes for select
  using (
    couple_id = public.my_couple_id()
    and (user_id = auth.uid() or public.has_voted(topic_id))
  );
-- 한 번 고르면 못 바꾼다 — update/delete 정책을 두지 않는다.
-- (바꿀 수 있으면 상대 답을 보고 뒤집을 수 있어 잠금이 무의미해진다)
create policy "topic_votes_insert" on public.topic_votes for insert
  with check (couple_id = public.my_couple_id() and user_id = auth.uid());

-- topic_comments: 투표 전에는 읽지도 쓰지도 못한다.
create policy "topic_comments_select" on public.topic_comments for select
  using (couple_id = public.my_couple_id() and public.has_voted(topic_id));
create policy "topic_comments_insert" on public.topic_comments for insert
  with check (
    couple_id = public.my_couple_id()
    and author_id = auth.uid()
    and public.has_voted(topic_id)
  );
create policy "topic_comments_delete" on public.topic_comments for delete
  using (author_id = auth.uid());

-- 상대가 투표·댓글하면 즉시 반영 (§7.5)
alter publication supabase_realtime add table public.topic_votes;
alter publication supabase_realtime add table public.topic_comments;

-- 롤 권한 (grants.sql의 default privileges는 같은 롤이 만든 객체에만 적용돼 누락될 수 있어 명시)
grant select, insert, update, delete on public.topics to anon, authenticated, service_role;
grant select, insert, update, delete on public.topic_votes to anon, authenticated, service_role;
grant select, insert, update, delete on public.topic_comments to anon, authenticated, service_role;
grant execute on function public.has_voted(uuid) to anon, authenticated, service_role;

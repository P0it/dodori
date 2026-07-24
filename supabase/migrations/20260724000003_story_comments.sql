-- ============================================================
-- story_comments — 스토리 답장. DM이 없으니 인스타처럼 사라지지 않고 스토리 아래에 남는다.
-- 대댓글은 없다: 둘뿐인 대화에 층이 생길 이유가 없다 (post_comments와 다른 점).
-- ============================================================

create table public.story_comments (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  author_id uuid not null references auth.users (id),
  body text not null,
  created_at timestamptz not null default now()
);
create index story_comments_story_idx on public.story_comments (story_id, created_at);

alter table public.story_comments enable row level security;

-- story 스코프를 따라간다. 삭제는 본인 것만 (post_comments와 동일)
create policy "story_comments_select" on public.story_comments for select
  using (story_id in (select id from public.stories where couple_id = public.my_couple_id()));
create policy "story_comments_insert" on public.story_comments for insert
  with check (
    author_id = auth.uid()
    and story_id in (select id from public.stories where couple_id = public.my_couple_id())
  );
create policy "story_comments_delete" on public.story_comments for delete
  using (author_id = auth.uid());

alter publication supabase_realtime add table public.story_comments;

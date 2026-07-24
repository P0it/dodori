-- ============================================================
-- stories (사진 1장짜리 하루 스토리) — 추억(post) 아래의 가벼운 층
-- 만료 삭제가 없다: created_at > now() - 24h면 홈 링에 뜨고, 아니면 보관함에만 남는다.
-- 그래서 cron도 Storage 정리도 없다.
-- ============================================================

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  -- 올린 날 데이트 앨범. 트랙이 지워져도 스토리는 남는다
  track_id uuid references public.tracks (id) on delete set null,
  caption text not null default '',
  -- 상대가 본 시각. 커플 = 2인이므로 뷰 테이블 대신 컬럼 하나로 충분
  seen_at timestamptz,
  created_at timestamptz not null default now()
);
create index stories_couple_created_idx on public.stories (couple_id, created_at desc);
create index stories_track_idx on public.stories (track_id);

create table public.story_reactions (
  story_id uuid not null references public.stories (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (story_id, user_id, emoji)
);

-- ---------- photos: 부모 2택1 → 3택1 ----------
alter table public.photos add column story_id uuid references public.stories (id) on delete cascade;
alter table public.photos drop constraint photos_one_parent;
alter table public.photos add constraint photos_one_parent
  check (num_nonnulls(track_id, post_id, story_id) = 1);
create index photos_story_idx on public.photos (story_id);

-- ============================================================
-- RLS — posts와 같은 모양
-- ============================================================
alter table public.stories enable row level security;
alter table public.story_reactions enable row level security;

create policy "stories_select" on public.stories for select
  using (couple_id = public.my_couple_id());
create policy "stories_insert" on public.stories for insert
  with check (couple_id = public.my_couple_id() and author_id = auth.uid());
-- update는 seen_at 기록용 — 상대가 본 표시를 남겨야 하므로 커플 범위 전체에 연다
create policy "stories_update" on public.stories for update
  using (couple_id = public.my_couple_id());
create policy "stories_delete" on public.stories for delete using (author_id = auth.uid());

create policy "story_reactions_select" on public.story_reactions for select
  using (story_id in (select id from public.stories where couple_id = public.my_couple_id()));
create policy "story_reactions_insert" on public.story_reactions for insert
  with check (
    user_id = auth.uid()
    and story_id in (select id from public.stories where couple_id = public.my_couple_id())
  );
create policy "story_reactions_delete" on public.story_reactions for delete
  using (user_id = auth.uid());

-- ---------- photos 정책 교체: track / post / story 3분기 ----------
-- 안 하면 스토리 사진이 전부 막힌다. delete 정책(uploader_id)은 그대로 둔다.
drop policy "photos_select" on public.photos;
drop policy "photos_insert" on public.photos;

create policy "photos_select" on public.photos for select
  using (
    track_id in (select id from public.tracks where couple_id = public.my_couple_id())
    or post_id in (select id from public.posts where couple_id = public.my_couple_id())
    or story_id in (select id from public.stories where couple_id = public.my_couple_id())
  );
create policy "photos_insert" on public.photos for insert
  with check (
    uploader_id = auth.uid()
    and (
      track_id in (select id from public.tracks where couple_id = public.my_couple_id())
      or post_id in (select id from public.posts where couple_id = public.my_couple_id())
      or story_id in (select id from public.stories where couple_id = public.my_couple_id())
    )
  );

-- ============================================================
-- Realtime 발행 (§7.5)
-- ============================================================
alter publication supabase_realtime add table public.stories;
alter publication supabase_realtime add table public.story_reactions;

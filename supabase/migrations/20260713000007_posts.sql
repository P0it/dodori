-- ============================================================
-- posts (커플 내부 SNS 게시물) — 스튜디오 = 우리 계정 피드
-- 트랙(데이트)과 독립된 일상 게시물. 공유 범위는 커플 내부뿐 — 기존 my_couple_id() 술어 재사용.
-- ============================================================

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  caption text not null default '',
  created_at timestamptz not null default now()
);
create index posts_couple_created_idx on public.posts (couple_id, created_at desc);

create table public.post_reactions (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, emoji)
);

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references auth.users (id),
  body text not null,
  created_at timestamptz not null default now()
);
create index post_comments_post_idx on public.post_comments (post_id, created_at);

-- ---------- photos: 부모가 track 또는 post ----------
-- 리사이즈·EXIF·업로드·썸네일 파이프라인을 그대로 재사용하기 위해 별도 테이블 대신 확장.
-- Storage 경로는 {couple_id}/{post_id}/{uuid}.jpg — 기존 버킷 정책(첫 폴더 = my_couple_id)을 그대로 통과.
alter table public.photos alter column track_id drop not null;
alter table public.photos add column post_id uuid references public.posts (id) on delete cascade;
alter table public.photos add constraint photos_one_parent
  check (num_nonnulls(track_id, post_id) = 1);
create index photos_post_idx on public.photos (post_id, created_at);

-- ============================================================
-- RLS
-- ============================================================
alter table public.posts enable row level security;
alter table public.post_reactions enable row level security;
alter table public.post_comments enable row level security;

-- posts: 커플 공유 조회, 작성·삭제는 본인 것만
create policy "posts_select" on public.posts for select
  using (couple_id = public.my_couple_id());
create policy "posts_insert" on public.posts for insert
  with check (couple_id = public.my_couple_id() and author_id = auth.uid());
create policy "posts_update" on public.posts for update using (author_id = auth.uid());
create policy "posts_delete" on public.posts for delete using (author_id = auth.uid());

-- post_reactions: post 스코프 따라감. 쓰기·삭제는 본인 리액션만
create policy "post_reactions_select" on public.post_reactions for select
  using (post_id in (select id from public.posts where couple_id = public.my_couple_id()));
create policy "post_reactions_insert" on public.post_reactions for insert
  with check (
    user_id = auth.uid()
    and post_id in (select id from public.posts where couple_id = public.my_couple_id())
  );
create policy "post_reactions_delete" on public.post_reactions for delete
  using (user_id = auth.uid());

-- post_comments: post 스코프 따라감. 삭제는 본인 것만 (notes 정책과 동일)
create policy "post_comments_select" on public.post_comments for select
  using (post_id in (select id from public.posts where couple_id = public.my_couple_id()));
create policy "post_comments_insert" on public.post_comments for insert
  with check (
    author_id = auth.uid()
    and post_id in (select id from public.posts where couple_id = public.my_couple_id())
  );
create policy "post_comments_delete" on public.post_comments for delete
  using (author_id = auth.uid());

-- ---------- photos 정책 교체: track 분기 + post 분기 ----------
-- 기존 정책은 track_id로만 스코프를 잡으므로 post 사진이 전부 막힌다. delete 정책(uploader_id)은 그대로 둔다.
drop policy "photos_select" on public.photos;
drop policy "photos_insert" on public.photos;

create policy "photos_select" on public.photos for select
  using (
    track_id in (select id from public.tracks where couple_id = public.my_couple_id())
    or post_id in (select id from public.posts where couple_id = public.my_couple_id())
  );
create policy "photos_insert" on public.photos for insert
  with check (
    uploader_id = auth.uid()
    and (
      track_id in (select id from public.tracks where couple_id = public.my_couple_id())
      or post_id in (select id from public.posts where couple_id = public.my_couple_id())
    )
  );

-- ============================================================
-- Realtime 발행 (§7.5)
-- ============================================================
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.post_reactions;
alter publication supabase_realtime add table public.post_comments;

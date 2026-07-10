-- ============================================================
-- dodori 스키마 v1 (PRD §5)
-- 모든 도메인 테이블은 couple 스코프 RLS. 상태 컬럼 없이 date로 파생(§7.2).
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null default '',
  birthday date,
  avatar_url text,
  push_token text,
  created_at timestamptz not null default now()
);

-- ---------- couples ----------
create table public.couples (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique, -- nanoid(10), 수락 시 null로 무효화(§7.1), null 재발급 전 상태 허용
  started_at date, -- 처음 만난 날 (온보딩에서 입력)
  created_at timestamptz not null default now()
);

create table public.couple_members (
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null unique references auth.users (id) on delete cascade, -- 유저당 커플 1개
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);

-- 현재 유저의 couple_id 조회 (RLS 정책 공통, security definer로 재귀 회피)
create or replace function public.my_couple_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select couple_id from public.couple_members where user_id = auth.uid()
$$;

-- ---------- events (개인 일정) ----------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  title_hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index events_couple_starts_idx on public.events (couple_id, starts_at);

-- 제목 숨김 뷰: 상대의 title_hidden 일정은 '바쁨'으로 치환 (§5 — RLS로 막으면 캘린더에서 사라지므로 뷰에서 처리)
create view public.events_visible
with (security_invoker = true) as
select
  id, couple_id, owner_id,
  case when title_hidden and owner_id <> auth.uid() then '바쁨' else title end as title,
  starts_at, ends_at, all_day, title_hidden, created_at
from public.events;

-- ---------- tracks (데이트) ----------
create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text not null default 'Untitled',
  date date not null, -- date < today(KST) → released (§7.2, 상태 컬럼 없음)
  duration_min integer,
  cover_photo_id uuid, -- photos FK는 아래에서 추가 (순환 참조)
  liked boolean not null default false, -- Favorites (§5)
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);
create index tracks_couple_date_idx on public.tracks (couple_id, date);

-- ---------- places (전역 캐시, 네이버 검색 결과 담기 시 upsert §7.4) ----------
create table public.places (
  id uuid primary key default gen_random_uuid(),
  naver_id text unique,
  name text not null,
  category text,
  address text,
  lat double precision,
  lng double precision,
  link text,
  created_at timestamptz not null default now()
);

create table public.track_places (
  track_id uuid not null references public.tracks (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  visit_time time,
  sort_order integer not null default 0,
  added_by uuid not null references auth.users (id),
  done boolean not null default false,
  primary key (track_id, place_id)
);

-- ---------- photos ----------
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks (id) on delete cascade,
  uploader_id uuid not null references auth.users (id),
  storage_path text not null, -- {couple_id}/{track_id}/{uuid}.jpg (§7.3)
  width integer,
  height integer,
  taken_at timestamptz, -- EXIF, 실패 시 null → created_at 정렬 폴백
  created_at timestamptz not null default now()
);
create index photos_track_idx on public.photos (track_id, taken_at, created_at);

alter table public.tracks
  add constraint tracks_cover_photo_fk
  foreign key (cover_photo_id) references public.photos (id) on delete set null;

-- ---------- notes (라이너 노트) ----------
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks (id) on delete cascade,
  author_id uuid not null references auth.users (id),
  body text not null,
  created_at timestamptz not null default now()
);

-- ---------- anniversaries (Singles) ----------
create table public.anniversaries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  type text not null check (type in ('d100', 'd200', 'd300', 'yearly', 'birthday', 'custom')),
  label text not null,
  date date not null,
  repeat_yearly boolean not null default false,
  track_id uuid references public.tracks (id) on delete set null,
  created_at timestamptz not null default now()
);
create index anniversaries_couple_idx on public.anniversaries (couple_id, date);

-- ---------- playlists (커스텀/테마만 실체 테이블 §5) ----------
create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  kind text not null default 'custom' check (kind = 'custom'),
  name text not null,
  cover_photo_id uuid references public.photos (id) on delete set null,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.playlist_places (
  playlist_id uuid not null references public.playlists (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  added_by uuid not null references auth.users (id),
  added_at timestamptz not null default now(),
  primary key (playlist_id, place_id)
);

-- ============================================================
-- RLS (§5: 전부 couple 스코프)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.events enable row level security;
alter table public.tracks enable row level security;
alter table public.places enable row level security;
alter table public.track_places enable row level security;
alter table public.photos enable row level security;
alter table public.notes enable row level security;
alter table public.anniversaries enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_places enable row level security;

-- profiles: 본인 + 같은 커플 멤버 조회, 본인만 수정
create policy "profiles_select" on public.profiles for select
  using (
    id = auth.uid()
    or id in (select user_id from public.couple_members where couple_id = public.my_couple_id())
  );
create policy "profiles_insert" on public.profiles for insert with check (id = auth.uid());
create policy "profiles_update" on public.profiles for update using (id = auth.uid());

-- couples: 내 커플만. 생성은 인증 유저 누구나(초대 발급 플로우), 수정은 멤버만
create policy "couples_select" on public.couples for select using (id = public.my_couple_id());
create policy "couples_insert" on public.couples for insert to authenticated with check (true);
create policy "couples_update" on public.couples for update using (id = public.my_couple_id());

-- couple_members: 내 커플 멤버 조회. insert는 본인 행만(커플 생성 직후 자기 등록),
-- 상대 합류는 claim-invite Edge Function(service role)이 수행 (§7.1 race 방지)
create policy "couple_members_select" on public.couple_members for select
  using (couple_id = public.my_couple_id() or user_id = auth.uid());
create policy "couple_members_insert" on public.couple_members for insert
  with check (user_id = auth.uid());

-- events: 조회는 커플 공유, 쓰기는 owner만 (§5)
create policy "events_select" on public.events for select using (couple_id = public.my_couple_id());
create policy "events_insert" on public.events for insert
  with check (couple_id = public.my_couple_id() and owner_id = auth.uid());
create policy "events_update" on public.events for update
  using (owner_id = auth.uid());
create policy "events_delete" on public.events for delete
  using (owner_id = auth.uid());

-- tracks: 커플 공유 CRUD
create policy "tracks_select" on public.tracks for select using (couple_id = public.my_couple_id());
create policy "tracks_insert" on public.tracks for insert
  with check (couple_id = public.my_couple_id() and created_by = auth.uid());
create policy "tracks_update" on public.tracks for update using (couple_id = public.my_couple_id());
create policy "tracks_delete" on public.tracks for delete using (couple_id = public.my_couple_id());

-- places: 전역 읽기(캐시), 쓰기는 인증 유저 (담기 시 upsert §7.4)
create policy "places_select" on public.places for select to authenticated using (true);
create policy "places_insert" on public.places for insert to authenticated with check (true);

-- track_places: 트랙 스코프 따라감
create policy "track_places_select" on public.track_places for select
  using (track_id in (select id from public.tracks where couple_id = public.my_couple_id()));
create policy "track_places_write" on public.track_places for insert
  with check (
    added_by = auth.uid()
    and track_id in (select id from public.tracks where couple_id = public.my_couple_id())
  );
create policy "track_places_update" on public.track_places for update
  using (track_id in (select id from public.tracks where couple_id = public.my_couple_id()));
create policy "track_places_delete" on public.track_places for delete
  using (track_id in (select id from public.tracks where couple_id = public.my_couple_id()));

-- photos: 조회·추가는 커플, 삭제는 본인 것만 (§5)
create policy "photos_select" on public.photos for select
  using (track_id in (select id from public.tracks where couple_id = public.my_couple_id()));
create policy "photos_insert" on public.photos for insert
  with check (
    uploader_id = auth.uid()
    and track_id in (select id from public.tracks where couple_id = public.my_couple_id())
  );
create policy "photos_delete" on public.photos for delete using (uploader_id = auth.uid());

-- notes: 조회·추가는 커플, 삭제는 본인 것만 (§5)
create policy "notes_select" on public.notes for select
  using (track_id in (select id from public.tracks where couple_id = public.my_couple_id()));
create policy "notes_insert" on public.notes for insert
  with check (
    author_id = auth.uid()
    and track_id in (select id from public.tracks where couple_id = public.my_couple_id())
  );
create policy "notes_delete" on public.notes for delete using (author_id = auth.uid());

-- anniversaries: 커플 스코프 (자동 생성은 Edge Function service role)
create policy "anniversaries_select" on public.anniversaries for select
  using (couple_id = public.my_couple_id());
create policy "anniversaries_insert" on public.anniversaries for insert
  with check (couple_id = public.my_couple_id());
create policy "anniversaries_update" on public.anniversaries for update
  using (couple_id = public.my_couple_id());
create policy "anniversaries_delete" on public.anniversaries for delete
  using (couple_id = public.my_couple_id());

-- playlists / playlist_places: 커플 스코프
create policy "playlists_select" on public.playlists for select
  using (couple_id = public.my_couple_id());
create policy "playlists_insert" on public.playlists for insert
  with check (couple_id = public.my_couple_id() and created_by = auth.uid());
create policy "playlists_update" on public.playlists for update
  using (couple_id = public.my_couple_id());
create policy "playlists_delete" on public.playlists for delete
  using (couple_id = public.my_couple_id());

create policy "playlist_places_select" on public.playlist_places for select
  using (playlist_id in (select id from public.playlists where couple_id = public.my_couple_id()));
create policy "playlist_places_insert" on public.playlist_places for insert
  with check (
    added_by = auth.uid()
    and playlist_id in (select id from public.playlists where couple_id = public.my_couple_id())
  );
create policy "playlist_places_delete" on public.playlist_places for delete
  using (playlist_id in (select id from public.playlists where couple_id = public.my_couple_id()));

-- ============================================================
-- Realtime 발행 (§7.5: events, tracks, photos, notes)
-- ============================================================
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.tracks;
alter publication supabase_realtime add table public.photos;
alter publication supabase_realtime add table public.notes;

-- ============================================================
-- Storage: photos 버킷 + couple 스코프 정책 (§5, §7.3 경로 {couple_id}/{track_id}/{uuid}.jpg)
-- ============================================================
insert into storage.buckets (id, name, public) values ('photos', 'photos', false);

create policy "photos_bucket_select" on storage.objects for select
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = public.my_couple_id()::text);
create policy "photos_bucket_insert" on storage.objects for insert
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = public.my_couple_id()::text);
create policy "photos_bucket_delete" on storage.objects for delete
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = public.my_couple_id()::text and owner = auth.uid());

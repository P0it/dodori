-- 오늘의 추천곡 풀 — 전역 참조 데이터(커플 스코프 아님).
-- 모든 커플이 같은 날 같은 곡을 본다. 배정 테이블도 cron도 없다:
-- 클라이언트가 KST 날짜로 seq를 계산한다 (lib/song.ts pickTodaySong).
--
-- 곡은 빌드타임에 scripts/build-song-pool.py 가 iTunes 검증을 거쳐 시드한다.
-- artwork/preview/apple_url 을 함께 저장해 런타임엔 외부 API 호출이 없다.

create table public.song_pool (
  id          uuid primary key default gen_random_uuid(),
  seq         int    not null unique,        -- 0..N-1 연속. 결정론적 픽의 인덱스
  itunes_id   bigint not null unique,        -- 중복 제거 자연키
  title       text   not null,               -- iTunes trackName 표기
  artist      text   not null,
  artwork_url text   not null,               -- 600x600
  preview_url text   not null,               -- 30초 m4a
  apple_url   text   not null,               -- music.apple.com/kr/...
  mood        text,                          -- 발굴 시 무드. 0.1에선 표시 안 함
  created_at  timestamptz not null default now()
);

alter table public.song_pool enable row level security;

-- 커플 데이터가 아니라 공용 카탈로그다 — 로그인했으면 누구나 읽는다.
-- 쓰기 정책은 없다: 시드·향후 cron은 service_role(RLS 우회)로만 넣는다.
create policy song_pool_select on public.song_pool
  for select to authenticated using (true);

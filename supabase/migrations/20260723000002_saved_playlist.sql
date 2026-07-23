-- 찜 — 커플당 하나씩 자동으로 존재하는 기본 플레이리스트(장소 전용).
-- 새 테이블을 만들지 않고 기존 playlists.kind를 연다. schema_v1이 kind 컬럼을 이미 두고
-- check로 'custom'만 막아둔 상태였다.
alter table public.playlists drop constraint playlists_kind_check;
alter table public.playlists add constraint playlists_kind_check
  check (kind in ('custom', 'saved'));

-- 커플당 찜은 정확히 하나. 부분 유니크 인덱스가 아래 트리거의 멱등성을 보장한다.
create unique index playlists_saved_unique
  on public.playlists (couple_id) where kind = 'saved';

-- 기존 커플 백필 — 가장 먼저 합류한 멤버를 created_by로.
insert into public.playlists (couple_id, kind, name, created_by)
select distinct on (cm.couple_id) cm.couple_id, 'saved', '찜', cm.user_id
from public.couple_members cm
order by cm.couple_id, cm.joined_at
on conflict do nothing;

-- 신규 커플 자동 생성. couples가 아니라 couple_members에 거는 이유:
-- playlists.created_by가 not null references auth.users라 멤버가 있어야 채울 수 있다.
-- 두 번째 멤버가 들어와도 위 유니크 인덱스가 중복을 막는다.
create or replace function public.ensure_saved_playlist()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.playlists (couple_id, kind, name, created_by)
  values (new.couple_id, 'saved', '찜', new.user_id)
  on conflict do nothing;
  return new;
end;
$$;

create trigger couple_members_ensure_saved_playlist
  after insert on public.couple_members
  for each row execute function public.ensure_saved_playlist();

-- 앨범 ♡ 폐기 — 하트는 장소 하나에만 쓴다. 회상은 피드 탭의 일.
alter table public.tracks drop column liked;

-- 온디바이스 렌디션 전환 + 커플당 사진 쿼터
--
-- 서버 이미지 변환(Storage Image Transformations)은 Pro에서 원본 100장까지만 무료라
-- Spend Cap을 켜면 곧 기능이 제한된다. 업로드할 때 기기에서 1080(본체)/360(목록)을 만들어
-- 함께 올리는 방식으로 바꾼다. 기존 사진은 _360 파일이 없으므로 renditions=false로 남겨
-- 기존 변환 방식으로 폴백한다.

alter table public.photos
  add column renditions boolean not null default false;

-- ---------- couple_id (쿼터를 커플 단위로 세기 위해) ----------
-- 지금은 storage_path 접두사에만 있다: {couple_id}/{parent_id}/{uuid}.jpg

alter table public.photos
  add column couple_id uuid references public.couples (id) on delete cascade;

-- 접두사가 uuid 꼴이고 실재하는 커플일 때만 채운다.
-- 하나라도 못 채우면 아래 set not null이 실패해서 조용히 망가지는 대신 크게 터진다.
update public.photos p
  set couple_id = split_part(p.storage_path, '/', 1)::uuid
  where p.storage_path ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/'
    and exists (
      select 1 from public.couples c
      where c.id = split_part(p.storage_path, '/', 1)::uuid
    );

alter table public.photos
  alter column couple_id set not null;

create index photos_couple_idx on public.photos (couple_id);

-- ---------- 요금제와 한도 ----------
-- 스토어 결제는 개인 계정 단위지만 도돌이의 혜택은 두 사람이 함께 받는다 — 커플에 귀속시킨다.
-- 트리거가 상수 대신 이 컬럼을 읽으므로 결제 연동 시 값만 바꾸면 된다.

alter table public.couples
  add column plan text not null default 'free',
  add column photo_quota integer not null default 100;

create or replace function public.enforce_photo_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  used integer;
  allowed integer;
begin
  select photo_quota into allowed from public.couples where id = new.couple_id;
  if allowed is null then
    return new;
  end if;
  select count(*) into used from public.photos where couple_id = new.couple_id;
  if used >= allowed then
    raise exception '사진 보관 한도에 도달했어요' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger photos_quota_check
  before insert on public.photos
  for each row execute function public.enforce_photo_quota();

-- 동영상 지원 + 쿼터를 장수에서 바이트 총량으로
--
-- 15초 720p 영상 하나가 약 5MB — 사진 27장이다. 장수(photo_quota=100)로는 셀 수 없다.
-- 커플당 무료 용량(200MB)을 넘으면 새 업로드만 막고, 이미 올린 것은 절대 지우지 않으며
-- 열람도 계속 된다 (2026-08-12 설계 문서).

-- ---------- photos: 미디어 종류 · 길이 · 실제 용량 ----------
-- media를 확장자에서 파생하지 않고 컬럼으로 두는 이유: 표시 분기(캐러셀이 이 칸을 영상으로
-- 그릴지)가 문자열 접미사 검사에 기대면 취약하고, duration_ms가 어차피 필요하다
-- (스토리 뷰어 진행바가 재생 전에 칸 길이를 알아야 튀지 않는다).

alter table public.photos
  add column media text not null default 'photo' check (media in ('photo', 'video')),
  add column duration_ms integer,
  add column bytes bigint not null default 0;

-- 기존 행 백필 — 스토리지 객체의 실제 크기 합.
-- renditions=true면 본체 + _360 두 개, false(렌디션 도입 전)면 본체 하나뿐이다.
-- 못 채운 행은 0으로 남아 무료로 계산될 뿐이라 실패 방향이 안전하다.
update public.photos p
set bytes = coalesce((
  select sum((o.metadata ->> 'size')::bigint)
  from storage.objects o
  where o.bucket_id = 'photos'
    and o.name in (
      p.storage_path,
      case when p.renditions then regexp_replace(p.storage_path, '\.jpg$', '_360.jpg') end
    )
), 0);

-- ---------- couples: 장수 쿼터 → 바이트 쿼터 ----------
-- 200MB = 사진 약 1,080장 또는 15초 영상 약 40개.
-- 한도는 나중에 올릴 수는 있어도 내리긴 어려우므로(기존 사용자 반발) 베타 실측 후 확정한다.
-- 트리거가 상수 대신 이 컬럼을 읽으므로 결제 연동 시 값만 바꾸면 된다.

alter table public.couples
  add column storage_quota_bytes bigint not null default 209715200;

alter table public.couples
  drop column photo_quota;

-- ---------- 트리거 교체 ----------
drop trigger if exists photos_quota_check on public.photos;
drop function if exists public.enforce_photo_quota();

create or replace function public.enforce_storage_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  used bigint;
  allowed bigint;
begin
  select storage_quota_bytes into allowed from public.couples where id = new.couple_id;
  if allowed is null then
    return new;
  end if;
  select coalesce(sum(bytes), 0) into used from public.photos where couple_id = new.couple_id;
  -- 장수 시절엔 "한 장 남았으면 못 올림"이었지만 바이트는 이번 것까지 더해 정확히 본다
  if used + coalesce(new.bytes, 0) > allowed then
    raise exception '보관 공간이 가득 찼어요' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger photos_quota_check
  before insert on public.photos
  for each row execute function public.enforce_storage_quota();

-- 삭제 시 감소는 자동이다 — 쿼터가 sum(bytes)라 행이 지워지면 그대로 준다.

-- ---------- 사용량 조회 ----------
-- 클라이언트가 전 행을 받아와 합치지 않도록 합계만 돌려준다.
create or replace function public.storage_used_bytes()
returns bigint
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(sum(bytes), 0) from public.photos where couple_id = public.my_couple_id();
$$;

-- ---------- 버킷 제한 ----------
-- 지금까지는 둘 다 비어 있어 무엇이든 올라갈 수 있었다. 15초 720p는 5MB 남짓이므로
-- 50MB면 웹 무압축 업로드까지 넉넉하다.
-- (Supabase 대시보드의 프로젝트 전역 상한이 이 값보다 우선하므로 원격에서는 그쪽도 확인할 것)
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['image/jpeg', 'video/mp4']
where id = 'photos';

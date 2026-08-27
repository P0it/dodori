-- ============================================================
-- 쿼터가 세는 바이트를 클라이언트 신고값에서 실제 파일 크기로.
--
-- photos.bytes는 앱이 계산해서 보낸 값이고, enforce_storage_quota가 그걸 그대로 믿었다.
-- 즉 한도(200MB)를 강제하는 마지막 관문이 클라이언트의 정직함에 기대고 있었다 —
-- bytes=0으로 보내면 한도가 없는 것과 같다.
--
-- 스토리지 객체는 insert보다 **먼저** 올라간다(api/photos.ts: 업로드 → insert). 그래서
-- 이 시점에 실제 크기를 읽을 수 있다. 한 미디어가 차지하는 파일은 본체와 렌디션인데,
-- 셋 다 같은 uuid로 시작하므로(`{uuid}.mp4` `{uuid}_poster.jpg` `{uuid}_360.jpg`)
-- 확장자를 떼어낸 접두사로 모으면 lib/media.ts의 경로 규칙을 SQL에 복제하지 않아도 된다.
--
-- 크기를 읽지 못하면(메타데이터가 아직 없는 등) 신고값으로 물러난다 — 새 업로드를 막는
-- 쪽보다 한 번 헐겁게 세는 쪽이 사용자에게 덜 나쁘다.
-- ============================================================

create or replace function public.enforce_storage_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  used bigint;
  allowed bigint;
  actual bigint;
begin
  -- 실제로 올라간 파일의 합. 클라이언트가 뭐라고 신고했든 이 값이 진실이다.
  select coalesce(sum((o.metadata ->> 'size')::bigint), 0)
  into actual
  from storage.objects o
  where o.bucket_id = 'photos'
    and o.name like regexp_replace(new.storage_path, '\.(jpg|mp4)$', '') || '%';

  new.bytes := coalesce(nullif(actual, 0), new.bytes, 0);

  select storage_quota_bytes into allowed from public.couples where id = new.couple_id;
  if allowed is null then
    return new;
  end if;
  select coalesce(sum(bytes), 0) into used from public.photos where couple_id = new.couple_id;
  -- 장수 시절엔 "한 장 남았으면 못 올림"이었지만 바이트는 이번 것까지 더해 정확히 본다
  if used + new.bytes > allowed then
    raise exception '보관 공간이 가득 찼어요' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

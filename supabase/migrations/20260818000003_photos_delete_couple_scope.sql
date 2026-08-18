-- 사진 삭제를 커플 범위로 (2026-08-18)
-- 일정이 2026-07에 간 길과 같다(20260716000002_events_owner_select.sql): 서로 공유가 전제인 서비스에서
-- "올린 사람만 지울 수 있다"는 반쪽짜리다. 공용 앨범인데 상대가 올린 사진을 내가 정리할 수 없고,
-- 스토리지 쿼터는 couples 단위라 남의 사진이 먹은 용량을 내가 비울 수도 없었다.
-- uploader_id는 남긴다 — 누가 올렸는지 보여주는 값이지 권한이 아니게 된다.

drop policy if exists "photos_delete" on public.photos;
create policy "photos_delete" on public.photos for delete
  using (couple_id = public.my_couple_id());

-- 스토리지도 같이 열어야 한다. 행만 지워지고 파일이 남으면 쿼터가 영영 안 준다.
-- 폴더 첫 칸(= couple_id) 조건은 그대로 두고 owner 조건만 뺀다.
drop policy if exists "photos_bucket_delete" on storage.objects;
create policy "photos_bucket_delete" on storage.objects for delete
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = public.my_couple_id()::text);

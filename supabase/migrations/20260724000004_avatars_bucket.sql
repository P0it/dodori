-- 프로필 사진용 공개 버킷 (avatars)
-- photos 버킷과 달리 공개 — 아바타는 비민감정보이고, Avatar 컴포넌트가 공개 URL을
-- 그대로 Image uri로 쓰므로 모든 소비처(홈·피드·캘린더·스토리)가 무변경으로 동작한다.
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

-- 읽기는 공개 버킷이라 정책 불필요. 쓰기는 본인 폴더(${uid}/…)만.
create policy "avatars_bucket_insert" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_bucket_update" on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_bucket_delete" on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text and owner = auth.uid());

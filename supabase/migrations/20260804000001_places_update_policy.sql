-- places에 UPDATE 정책 추가 — 담기 upsert가 기존 장소에서 42501로 죽던 문제.
-- upsertPlace()는 naver_id 충돌 시 ON CONFLICT DO UPDATE를 타는데, UPDATE 정책이 없으면
-- 기본 거부라 기존 행이 USING을 통과하지 못하고 Postgres가 에러를 던진다(조용히 건너뛰지 않는다).
-- 결과: 한 번이라도 places에 들어온 장소는 코스·리스트에 다시 담을 수 없었다.
-- places는 이미 select/insert가 authenticated 전역 허용인 공용 장소 캐시 — update도 같은 범위로 맞춘다.
create policy "places_update" on public.places for update to authenticated
  using (true) with check (true);

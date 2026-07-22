-- 일정 소유자 선택 (2026-07)
-- 캘린더에 상대 몫의 일정도 등록할 수 있어야 한다(나/상대 선택) → insert의 owner_id = auth.uid() 강제를 풀고
-- "커플 멤버 중 하나"로 완화한다.
-- 수정·삭제도 커플 범위로 연다: 상대 소유로 만든 일정을 만든 사람이 못 고치면 기능이 반쪽이 된다.
-- 전제는 title_hidden 폐기와 같다 — 서로 공유가 전제인 서비스.

drop policy if exists "events_insert" on public.events;
create policy "events_insert" on public.events for insert
  with check (
    couple_id = public.my_couple_id()
    and owner_id in (
      select user_id from public.couple_members where couple_id = public.my_couple_id()
    )
  );

drop policy if exists "events_update" on public.events;
create policy "events_update" on public.events for update
  using (couple_id = public.my_couple_id())
  with check (
    couple_id = public.my_couple_id()
    and owner_id in (
      select user_id from public.couple_members where couple_id = public.my_couple_id()
    )
  );

drop policy if exists "events_delete" on public.events;
create policy "events_delete" on public.events for delete
  using (couple_id = public.my_couple_id());

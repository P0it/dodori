-- ============================================================
-- 투표 수정 — 상대가 아직 고르지 않았을 때만
--
-- 원래는 update 정책 자체가 없어 한 번 고르면 못 바꿨다. 이유는 뒤집기 방지:
-- 아무거나 찍어 상대 답을 열어보고 거기 맞춰 바꾸면 잠금이 무의미해진다.
-- 그런데 상대가 아직 투표하지 않았다면 내가 볼 상대 답이 애초에 없다 → 뒤집기가 원천 불가능하다.
-- 그 구간에서만 수정을 연다. 상대가 고르는 순간 내 표도 함께 잠긴다.
-- ============================================================

-- 상대가 이 주제에 투표했는가. has_voted()와 같은 이유로 security definer
-- (topic_votes 정책이 topic_votes를 참조하면 무한 재귀).
create or replace function public.partner_voted(p_topic_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.topic_votes
    where topic_id = p_topic_id
      and user_id <> auth.uid()
      and couple_id = public.my_couple_id()
  )
$$;

create policy "topic_votes_update" on public.topic_votes for update
  using (
    couple_id = public.my_couple_id()
    and user_id = auth.uid()
    and not public.partner_voted(topic_id)
  )
  with check (
    couple_id = public.my_couple_id()
    and user_id = auth.uid()
    and not public.partner_voted(topic_id)
  );

grant execute on function public.partner_voted(uuid) to anon, authenticated, service_role;

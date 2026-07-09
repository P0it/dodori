-- 커플 생성 + 본인 등록을 원자적으로 처리하는 RPC (PRD §7.1 초대 발급)
-- INSERT..RETURNING이 SELECT 정책에 막히는 문제와, 두 insert 사이의 비원자성을 함께 해결.
-- 또한 couple_members 직접 insert 정책은 임의 couple_id 합류가 가능해 제거한다
-- (합류는 claim-invite Edge Function(service role) 단일 경로).

drop policy "couples_insert" on public.couples;
drop policy "couple_members_insert" on public.couple_members;

create or replace function public.create_couple(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_couple_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if exists (select 1 from couple_members where user_id = auth.uid()) then
    raise exception 'already_connected';
  end if;
  if p_invite_code is null or length(p_invite_code) < 6 then
    raise exception 'invalid invite code';
  end if;

  insert into couples (invite_code) values (p_invite_code) returning id into v_couple_id;
  insert into couple_members (couple_id, user_id) values (v_couple_id, auth.uid());
  return v_couple_id;
end;
$$;

revoke execute on function public.create_couple(text) from anon, public;
grant execute on function public.create_couple(text) to authenticated;

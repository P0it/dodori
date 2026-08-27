-- ============================================================
-- 계정 삭제 · 연결 해제
--
-- 정책(2026-08-27 결정):
--   한 사람이 나가면 그 사람의 계정·프로필만 파기하고 **커플 기록은 남긴다**.
--   두 번째 사람까지 나간 시점에 커플의 모든 기록과 파일을 파기한다.
--   한쪽이 일방적으로 상대의 추억을 지우지 못하게 하는 것이 요점이다.
--
-- 이 정책이 스키마 변경을 강제한다. 지금은 작성자 컬럼이 전부 auth.users를 가리키는데,
--   1) cascade가 걸린 것(posts·stories·events…)은 탈퇴하는 순간 그 사람이 남긴 기록이 통째로
--      사라져 위 정책과 정면으로 어긋나고,
--   2) cascade가 없는 것(photos·notes·track_places…)은 FK 위반으로 **탈퇴 자체가 실패한다**.
--      (auth.admin.deleteUser가 에러를 뱉는다 — 계정 삭제 기능을 만들 수 없다)
--
-- 그래서 작성자 참조를 auth.users에서 **profiles로 옮기고**, profiles를 auth.users에서
-- 떼어낸다. 탈퇴하면 auth 계정은 사라지고 profiles는 이름을 지운 껍데기로 남아
-- "누가 썼는지" 자리만 지킨다. 기록은 그대로 있고, 개인정보는 남지 않는다.
-- ============================================================

-- ---------- 0. profiles 백필 ----------
-- 아래에서 콘텐츠 FK가 profiles를 가리키게 되므로, 콘텐츠를 가진 유저는 예외 없이
-- profiles 행이 있어야 한다. 로그인 때 ensureProfile이 만들지만 과거에 빠진 행이 있을 수 있다.
insert into public.profiles (id, nickname)
select u.id, coalesce(u.raw_user_meta_data ->> 'name', u.raw_user_meta_data ->> 'nickname', '')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- ---------- 1. profiles를 auth.users에서 분리 ----------
-- PK라 on delete set null을 걸 수 없다 — 제약 자체를 뗀다.
-- 행 생성은 지금까지처럼 앱의 ensureProfile이 맡는다.
alter table public.profiles drop constraint if exists profiles_id_fkey;

-- ---------- 2. 작성자 FK를 profiles로 재지정 ----------
-- 제약 이름을 하드코딩하지 않는다 — 원격에서 다른 이름으로 붙어 있으면 조용히 빗나간다.
-- 아래 세 테이블은 **계정에 딸린 것**이라 auth.users cascade가 정답이므로 건드리지 않는다:
--   couple_members  — 탈퇴하면 커플에서 빠지는 게 맞다
--   notifications   — 탈퇴자의 알림은 남길 이유가 없다
--   push_subscriptions — 기기 구독은 계정의 부속물이다
do $$
declare
  r record;
begin
  for r in
    select
      con.conname as name,
      rel.relname as tbl,
      att.attname as col
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid = rel.relnamespace
    join lateral unnest(con.conkey) as k(attnum) on true
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = k.attnum
    where con.contype = 'f'
      and ns.nspname = 'public'
      and con.confrelid = 'auth.users'::regclass
      and rel.relname <> all (array['couple_members', 'notifications', 'push_subscriptions'])
  loop
    execute format('alter table public.%I drop constraint %I', r.tbl, r.name);
    execute format(
      'alter table public.%I add constraint %I foreign key (%I) references public.profiles (id) on delete cascade',
      r.tbl, r.name, r.col
    );
  end loop;
end $$;

-- ---------- 3. 초대 코드 발급 (서버) ----------
-- 지금까지 코드는 클라이언트(api/couple.ts generateInviteCode)가 만들어 보냈다.
-- 연결 해제 뒤 남은 사람에게 새 코드를 쥐여 주는 건 서버가 해야 해서 같은 규칙을 여기에도 둔다.
-- 혼동 문자(0/O, 1/l/I)를 뺀 31자 알파벳, 길이 10 — 클라이언트와 같다.
-- search_path에 extensions를 함께 둔다 — pgcrypto(gen_random_bytes)가 public이 아니라
-- extensions 스키마에 설치돼 있어서, public만 걸면 함수를 찾지 못하고 마이그레이션이 멈춘다.
create or replace function public.gen_invite_code(p_len int default 10)
returns text
language sql
volatile
set search_path = public, extensions
as $$
  select string_agg(
           substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + (get_byte(b.bytes, i) % 31), 1),
           '' order by i
         )
  from (select gen_random_bytes(p_len) as bytes) b,
       generate_series(0, p_len - 1) as i;
$$;

-- ---------- 4. 파기 대상 파일 경로 ----------
-- 스토리지 객체는 supabase-js로 폴더를 재귀 조회할 수 없고, photos 테이블의 경로 규칙을
-- Edge Function에 복제하면 규칙이 두 벌이 된다. 실제 객체 목록을 그대로 돌려준다 —
-- 규칙에서 벗어난 고아 파일까지 같이 지워지는 것도 이 방식의 이점이다.
create or replace function public.couple_storage_paths(p_couple uuid)
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select o.name
  from storage.objects o
  where o.bucket_id = 'photos'
    and (storage.foldername(o.name))[1] = p_couple::text;
$$;

create or replace function public.user_avatar_paths(p_user uuid)
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select o.name
  from storage.objects o
  where o.bucket_id = 'avatars'
    and (storage.foldername(o.name))[1] = p_user::text;
$$;

-- 두 함수 모두 남의 커플·남의 아바타 경로를 알아낼 수 있으므로 앱에서 못 부르게 막는다.
-- 호출자는 service_role로 도는 Edge Function뿐이다.
revoke execute on function public.couple_storage_paths(uuid) from anon, authenticated, public;
revoke execute on function public.user_avatar_paths(uuid) from anon, authenticated, public;

-- ---------- 5. 연결에서 나가기 ----------
-- 멤버 행을 지우고, 남은 인원에 따라 갈린다:
--   1명 남음 → 커플 유지. 초대 코드가 비어 있으면(이미 수락돼 무효화된 상태) 새로 발급해
--              남은 사람이 곧바로 다시 초대할 수 있게 한다.
--   0명      → 커플 행 삭제. 나머지 테이블은 couple_id cascade로 함께 사라진다.
--              ⚠️ 스토리지 파일은 여기서 지워지지 않는다 — 호출자(Edge Function)가
--              couple_storage_paths로 **먼저** 지운 뒤 이 함수를 부른다.
create or replace function public.leave_couple(p_user uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_couple uuid;
  v_remaining int;
begin
  select couple_id into v_couple from public.couple_members where user_id = p_user;
  if v_couple is null then
    return -1; -- 연결된 커플 없음 — 호출자가 구분할 수 있게 음수로 알린다
  end if;

  delete from public.couple_members where user_id = p_user;
  select count(*) into v_remaining from public.couple_members where couple_id = v_couple;

  if v_remaining = 0 then
    delete from public.couples where id = v_couple;
  else
    update public.couples
    set invite_code = public.gen_invite_code()
    where id = v_couple and invite_code is null;
  end if;

  return v_remaining;
end;
$$;

revoke execute on function public.leave_couple(uuid) from anon, authenticated, public;

-- ---------- 6. 프로필 익명화 ----------
-- 탈퇴한 사람이 남긴 게시물·댓글의 작성자 자리를 지키되, 개인정보는 남기지 않는다.
-- 아바타 파일은 호출자가 스토리지에서 따로 지운다.
create or replace function public.anonymize_profile(p_user uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set nickname = '탈퇴한 사용자',
      avatar_url = null,
      birthday = null,
      push_token = null
  where id = p_user;
$$;

revoke execute on function public.anonymize_profile(uuid) from anon, authenticated, public;

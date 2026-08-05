-- 찜 리스트 타일이 이름 첫 글자('찜')로 그려지던 것 → 하트 아이콘.
-- 아이콘은 UI 분기가 아니라 데이터로 둔다 — 라이브러리 목록·담기 시트·지도 핀이 모두
-- playlists.icon 하나를 읽으므로 행만 고치면 세 곳이 함께 바뀐다.
-- 찜은 이름·색·아이콘을 편집할 수 없어(kind='saved') 사용자가 이 값을 되돌릴 일은 없다.
update public.playlists set icon = 'heart' where kind = 'saved' and icon is null;

-- 신규 커플의 찜도 하트로 만들어진다 (20260723000002의 함수를 아이콘만 더해 다시 정의)
create or replace function public.ensure_saved_playlist()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.playlists (couple_id, kind, name, icon, created_by)
  values (new.couple_id, 'saved', '찜', 'heart', new.user_id)
  on conflict do nothing;
  return new;
end;
$$;

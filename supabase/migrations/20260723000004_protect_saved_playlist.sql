-- 찜 플레이리스트 삭제 금지.
-- 찜은 커플당 하나만 존재하고, 그걸 만드는 트리거는 couple_members INSERT에서만 돈다.
-- 즉 한 번 지워지면 그 커플에게는 다시 생기지 않고 playlist_places까지 cascade로 날아간다
-- (찜 담기·추천이 영구히 죽는다). 클라이언트 버그나 직접 API 호출도 막도록 DB에서 닫는다.
-- 단, 커플 자체가 지워질 때의 cascade는 통과시킨다. 안 그러면 계정·커플 삭제가
-- 이 트리거에 막혀 영영 불가능해진다 (M6 스토어 요건). cascade 시점에는 부모 couples 행이
-- 같은 트랜잭션에서 이미 지워져 있으므로, 부모의 생존 여부로 직접 삭제와 cascade를 가른다.
create or replace function public.prevent_saved_playlist_delete()
returns trigger language plpgsql as $$
begin
  if old.kind = 'saved'
     and exists (select 1 from public.couples where id = old.couple_id) then
    raise exception '찜 플레이리스트는 삭제할 수 없어요';
  end if;
  return old;
end;
$$;

create trigger playlists_prevent_saved_delete
  before delete on public.playlists
  for each row execute function public.prevent_saved_playlist_delete();

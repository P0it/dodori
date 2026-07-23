-- 찜 플레이리스트 삭제 금지.
-- 찜은 커플당 하나만 존재하고, 그걸 만드는 트리거는 couple_members INSERT에서만 돈다.
-- 즉 한 번 지워지면 그 커플에게는 다시 생기지 않고 playlist_places까지 cascade로 날아간다
-- (찜 담기·추천이 영구히 죽는다). 클라이언트 버그나 직접 API 호출도 막도록 DB에서 닫는다.
create or replace function public.prevent_saved_playlist_delete()
returns trigger language plpgsql as $$
begin
  if old.kind = 'saved' then
    raise exception '찜 플레이리스트는 삭제할 수 없어요';
  end if;
  return old;
end;
$$;

create trigger playlists_prevent_saved_delete
  before delete on public.playlists
  for each row execute function public.prevent_saved_playlist_delete();

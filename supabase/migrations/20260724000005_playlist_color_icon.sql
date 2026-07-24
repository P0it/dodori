-- 플레이리스트 타일 표현 — 담은 장소 사진 커버 대신, 만들 때 고른 색·아이콘으로 표시.
-- color: 색 팔레트 키(앱의 eventColor 키와 동일 값 사용), icon: 이모지 한 글자. 둘 다 선택(널 허용).
alter table public.playlists
  add column if not exists color text,
  add column if not exists icon text;

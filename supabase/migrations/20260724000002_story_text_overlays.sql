-- ============================================================
-- 스토리 텍스트 스티커 — 사진 위에 얹는 텍스트를 "구워 넣지" 않고 데이터로 남긴다.
-- 원본 사진이 그대로라 앨범에 합류해도 깨끗하고, 나중에 수정·삭제도 열려 있다.
--
-- 모양: [{ id, text, x, y, size, rotation, color }] — 좌표·크기는 사진 기준 0~1 비율.
-- 클라이언트(lib/stories.parseOverlays)가 읽을 때 검증하므로 여기선 배열이라는 것만 강제한다.
-- ============================================================

alter table public.stories
  add column overlays jsonb not null default '[]'::jsonb,
  add constraint stories_overlays_is_array check (jsonb_typeof(overlays) = 'array');

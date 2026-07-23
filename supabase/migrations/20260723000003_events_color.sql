-- 일정 색 (2026-07) — "나=green / 상대=pink" 사람 인코딩 폐기의 짝.
-- 캘린더에서 색은 이제 사람이 아니라 일정의 속성이고, 등록할 때 직접 고른다.
-- 값은 팔레트 키(theme/tokens.ts eventColor) — hex를 저장하면 리스킨이 DB 마이그레이션이 된다.

alter table public.events
  add column color text not null default 'green'
  check (color in ('green', 'blue', 'purple', 'pink', 'amber', 'red'));

-- 뷰는 통과 뷰라 컬럼 추가 시 재생성이 필요하다.
drop view if exists public.events_visible;
create view public.events_visible
with (security_invoker = true) as
select
  id, couple_id, owner_id, title, description, color,
  starts_at, ends_at, all_day, created_at
from public.events;

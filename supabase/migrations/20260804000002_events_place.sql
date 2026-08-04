-- 일정에 장소 (2026-08) — 선택 사항. 네이버 검색으로 고른 곳을 places에 upsert하고 그 id를 건다.
-- 스냅샷(이름·주소 문자열)이 아니라 FK인 이유: 같은 장소가 데이트 코스·찜과 한 행을 공유해야
-- "가본 곳" 판정이나 나중의 장소 상세가 일정에도 그대로 걸린다.
-- 장소가 지워져도 일정은 남아야 하므로 on delete set null.

alter table public.events
  add column place_id uuid references public.places(id) on delete set null;

-- 뷰는 통과 뷰라 컬럼 추가 시 재생성이 필요하다.
drop view if exists public.events_visible;
create view public.events_visible
with (security_invoker = true) as
select
  id, couple_id, owner_id, title, description, color, place_id,
  starts_at, ends_at, all_day, created_at
from public.events;

-- 제목 숨김 폐기 + 일정 설명 추가 (2026-07)
-- 서로 공유가 전제인 서비스라 title_hidden('바쁨' 치환)은 불필요 → 컬럼·뷰 치환 로직 제거.
-- 대신 일정에 설명(메모)을 달 수 있게 description 추가. 설명도 커플에 그대로 공유된다.

-- 뷰가 events.title_hidden에 의존하므로 컬럼 변경 전에 먼저 내린다.
drop view if exists public.events_visible;

alter table public.events drop column if exists title_hidden;
alter table public.events add column description text;

-- events_visible: 이제 커플 공유 읽기 표면(통과 뷰). '바쁨' 치환 로직 없음.
create view public.events_visible
with (security_invoker = true) as
select
  id, couple_id, owner_id, title, description,
  starts_at, ends_at, all_day, created_at
from public.events;

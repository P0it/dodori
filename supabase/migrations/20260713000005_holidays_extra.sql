-- 임시공휴일·선거일 오버레이 (커플 캘린더 빨간 날)
--
-- 일반 공휴일(양력 고정 + 음력 3종 + 대체공휴일)은 클라이언트 src/lib/holidays.ts가 규칙으로 계산한다.
-- 계산이 불가능한 것은 국무회의가 그때그때 지정하는 임시공휴일·선거일뿐이고, 그것만 여기에 담는다.
-- sync-holidays Edge Function이 KASI 특일정보 API에서 채운다 (월 1회 cron).
--
-- 커플별 데이터가 아니라 전 국민 공통 데이터 → my_couple_id() 술어를 쓰지 않는다.
create table if not exists public.holidays_extra (
  date date primary key,
  name text not null,
  synced_at timestamptz not null default now()
);

alter table public.holidays_extra enable row level security;

-- 공개 참조 데이터: 로그인한 사용자는 누구나 읽는다. 쓰기는 service role(Edge Function)만.
drop policy if exists holidays_extra_read on public.holidays_extra;
create policy holidays_extra_read on public.holidays_extra
  for select to authenticated using (true);

grant select on public.holidays_extra to authenticated;

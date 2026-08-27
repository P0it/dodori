-- ============================================================
-- 알림 보관 기간 — 90일.
--
-- notifications는 지금까지 한 번 쌓이면 지워지지 않았다. 커플 하나가 하루 몇 건씩만 만들어도
-- 몇 년이면 수천 행이고, 배지 카운트와 목록 조회가 그 위를 지나간다.
--
-- 90일로 자르는 이유: 목록 화면은 최근 100건만 읽으므로(api/notifications.ts) 그보다 오래된
-- 행은 애초에 화면에 닿지 않는다. 안 읽은 것도 함께 지운다 — 90일 지난 알림이 배지 숫자로
-- 남아 있는 쪽이 사라지는 쪽보다 이상하다.
--
-- 원본(스토리·게시물)은 건드리지 않는다. 여기서 지우는 것은 "알림이 왔었다"는 기록뿐이다.
-- ============================================================

create or replace function public.purge_old_notifications()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.notifications where created_at < now() - interval '90 days';
$$;

revoke execute on function public.purge_old_notifications() from anon, authenticated, public;

-- 매일 19:00 UTC = 04:00 KST — 데모 커플 초기화와 같은 시간대(사람이 안 쓰는 시각)
select cron.schedule('purge-notifications', '0 19 * * *', 'select public.purge_old_notifications()');

-- ============================================================
-- 알림 큐 폴백 — 워커를 깨우는 유일한 신호였던 kicker의 뒷받침.
--
-- 지금까지 워커(Vercel Function)를 부르는 것은 enqueue_notification 트리거 안의
-- kick_notification_worker(pg_net) 하나뿐이었다. 설계 문서는 이 kicker를 "지금 깨워달라"는
-- 신호일 뿐이라 실패해도 된다고 적어두었는데, **실패했을 때 대신 깨울 것이 없었다.**
-- net.http_post 한 번이 유실되면 그 알림은 pushed_at이 null인 채로 큐에 영원히 남는다
-- (앱 안의 종·배지는 정상이고 푸시만 조용히 사라진다 — 알아채기 가장 어려운 실패다).
--
-- 그래서 미발송 행이 있는 동안만 매분 한 번 워커를 깨운다. 큐가 비어 있으면
-- 부분 인덱스(notifications_unsent_idx) 조회 하나로 끝나고 아무것도 부르지 않는다.
--
-- 이 cron은 kicker를 대체하지 않는다 — kicker는 즉시성(수 초 내 도착)을 담당하고,
-- 이 쪽은 놓친 것을 1분 안에 주워 담는 그물이다.
-- ============================================================

create or replace function public.sweep_notification_queue()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 큐가 비어 있으면 워커를 부르지 않는다 — 하루 1,440번의 빈 호출을 아낀다
  if exists (select 1 from public.notifications where pushed_at is null) then
    perform public.kick_notification_worker();
  end if;
end;
$$;

revoke execute on function public.sweep_notification_queue() from anon, authenticated, public;

-- 워커는 한 번에 50건씩 처리한다(api/notifications/deliver.ts BATCH). 밀린 큐가 그보다
-- 길면 다음 분에 이어서 가져가므로, 주기를 더 촘촘히 할 이유가 없다.
select cron.schedule('notify-sweep', '* * * * *', 'select public.sweep_notification_queue()');

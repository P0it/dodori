-- 임시공휴일 동기화 cron — 매월 1일 00:10 UTC = 09:10 KST.
-- 임시공휴일은 부정기적으로(몇 주 전에) 지정되므로 월 1회면 충분하다.
-- Vault 시크릿(project_url, service_role_key)은 daily-release와 공유한다.
create or replace function public.invoke_sync_holidays()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text;
  v_key text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'service_role_key';
  if v_url is null or v_key is null then
    raise notice 'sync-holidays skipped: vault secrets not set';
    return;
  end if;
  -- KASI API가 느려 함수가 10초 가까이 걸린다. pg_net 기본 5초로는 매번 타임아웃 로그가 남는다.
  perform net.http_post(
    url := v_url || '/functions/v1/sync-holidays',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_key, 'Content-Type', 'application/json'),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
end;
$$;

revoke execute on function public.invoke_sync_holidays() from anon, authenticated, public;

select cron.schedule('sync-holidays', '10 0 1 * *', 'select public.invoke_sync_holidays()');

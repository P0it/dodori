-- pg_cron 1개 (PRD §7.2): 매일 00:05 KST = 15:05 UTC → daily-release Edge Function 호출
-- service role 키는 커밋 금지이므로 Vault에서 읽는다. 배포 후 1회 아래를 SQL Editor에서 실행:
--   select vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key');
--   select vault.create_secret('https://<ref>.supabase.co', 'project_url');
create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.invoke_daily_release()
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
    raise notice 'daily-release skipped: vault secrets not set';
    return;
  end if;
  perform net.http_post(
    url := v_url || '/functions/v1/daily-release',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_key, 'Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
end;
$$;

revoke execute on function public.invoke_daily_release() from anon, authenticated, public;

select cron.schedule('daily-release', '5 15 * * *', 'select public.invoke_daily_release()');

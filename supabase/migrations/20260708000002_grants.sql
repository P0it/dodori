-- 테이블 권한 명시 — RLS는 정책으로 제어하고, 롤 권한은 Supabase 관례대로 부여한다.
-- (v1 마이그레이션 적용 시 기본 권한이 누락되는 환경이 있어 명시적으로 고정)
grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public
  to anon, authenticated, service_role;

grant execute on all functions in schema public to anon, authenticated, service_role;

-- 이후 생성되는 객체에도 동일 적용
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant execute on functions to anon, authenticated, service_role;

import { createClient } from 'npm:@supabase/supabase-js@2';

/** 호출자 JWT로 인증된 클라이언트 (RLS 적용) */
export function userClient(req: Request) {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
  );
}

/** service role 클라이언트 (RLS 우회 — 트랜잭션성 서버 규칙 전용) */
export function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** 호출자 uid 확인 (미인증 시 null) */
export async function callerId(req: Request): Promise<string | null> {
  const { data } = await userClient(req).auth.getUser();
  return data.user?.id ?? null;
}

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

/**
 * cron 전용 함수의 호출자 검증 — JWT의 role 클레임이 service_role인지 본다.
 * 서명 검증은 게이트웨이가 이미 했으므로 여기선 클레임만 확인한다.
 * (환경변수 키 문자열과 직접 비교하면 키 형식·로테이션에 깨진다)
 */
export function isServiceRole(req: Request): boolean {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const payload = token.split('.')[1];
  if (!payload) return false;
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json).role === 'service_role';
  } catch {
    return false;
  }
}

/** 호출자 uid 확인 (미인증 시 null) */
export async function callerId(req: Request): Promise<string | null> {
  const { data } = await userClient(req).auth.getUser();
  return data.user?.id ?? null;
}

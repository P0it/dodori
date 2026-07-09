// generate-anniversaries — 연결 완료 시 기념일 자동 생성 (PRD §7.1)
// 100/200/300일(1회) + 1주년·생일(repeat_yearly). 시작일·생일 변경 시 재호출하면 재계산(멱등).
// 규칙은 클라이언트 src/lib/anniversaries.ts와 동치 — 테스트로 검증한다.
import { adminClient, callerId, json, userClient } from '../_shared/client.ts';

const DAY_MS = 86_400_000;

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d) + days * DAY_MS);
  return t.toISOString().slice(0, 10);
}
function yearly(date: string, yearsAfter: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const ty = y + yearsAfter;
  const dim = new Date(Date.UTC(ty, m, 0)).getUTCDate();
  return `${ty}-${String(m).padStart(2, '0')}-${String(Math.min(d, dim)).padStart(2, '0')}`;
}
const isDate = (s: unknown): s is string =>
  typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const uid = await callerId(req);
  if (!uid) return json({ error: '로그인이 필요해요' }, 401);

  let body: { started_at?: unknown; birthday?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid body' }, 400);
  }
  if (!isDate(body.started_at)) return json({ error: 'started_at(YYYY-MM-DD)이 필요해요' }, 400);
  if (body.birthday != null && !isDate(body.birthday)) {
    return json({ error: 'birthday 형식이 올바르지 않아요' }, 400);
  }
  const startedAt = body.started_at;

  // 호출자의 커플 확인 (RLS 조회는 두 멤버 행이 모두 보이므로 본인 행으로 한정)
  const { data: membership } = await userClient(req)
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', uid)
    .maybeSingle();
  if (!membership) return json({ error: '커플 연결이 먼저 필요해요' }, 409);
  const coupleId = membership.couple_id;

  const admin = adminClient();

  // 시작일 저장 + 호출자 생일 저장
  const { error: coupleError } = await admin
    .from('couples')
    .update({ started_at: startedAt })
    .eq('id', coupleId);
  if (coupleError) return json({ error: coupleError.message }, 500);

  if (body.birthday) {
    const { error } = await admin
      .from('profiles')
      .update({ birthday: body.birthday })
      .eq('id', uid);
    if (error) return json({ error: error.message }, 500);
  }

  // 멤버 생일 수집 (상대가 아직 생일 미입력이면 그 생일 기념일은 다음 재호출 때 생성)
  // couple_members→profiles는 FK가 없어(둘 다 auth.users 참조) embed 불가 — 별도 조회
  const { data: memberRows } = await admin
    .from('couple_members')
    .select('user_id')
    .eq('couple_id', coupleId);
  const { data: members } = await admin
    .from('profiles')
    .select('nickname, birthday')
    .in('id', (memberRows ?? []).map((m) => m.user_id));

  type Spec = { type: string; label: string; date: string; repeat_yearly: boolean };
  const specs: Spec[] = [
    { type: 'd100', label: '100일', date: addDays(startedAt, 99), repeat_yearly: false },
    { type: 'd200', label: '200일', date: addDays(startedAt, 199), repeat_yearly: false },
    { type: 'd300', label: '300일', date: addDays(startedAt, 299), repeat_yearly: false },
    { type: 'yearly', label: '1주년', date: yearly(startedAt, 1), repeat_yearly: true },
  ];
  for (const p of members ?? []) {
    if (p.birthday) {
      specs.push({
        type: 'birthday',
        label: p.nickname ? `${p.nickname} 생일` : '생일',
        date: p.birthday,
        repeat_yearly: true,
      });
    }
  }

  // 멱등 재계산: 자동 생성분(custom 제외)만 지우고 다시 넣는다
  const { error: delError } = await admin
    .from('anniversaries')
    .delete()
    .eq('couple_id', coupleId)
    .neq('type', 'custom');
  if (delError) return json({ error: delError.message }, 500);

  const { error: insError } = await admin
    .from('anniversaries')
    .insert(specs.map((s) => ({ ...s, couple_id: coupleId })));
  if (insError) return json({ error: insError.message }, 500);

  return json({ created: specs.length });
});

// claim-invite — 초대 코드 수락 (PRD §7.1)
// 코드 검증 → 멤버 2인 확정 → 코드 무효화를 원자적으로 처리해 race를 방지한다.
// 원자성은 DB 함수(claim_invite) 안에서 invite_code를 조건부 null 업데이트로 잡는다.
import { adminClient, callerId, json } from '../_shared/client.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const uid = await callerId(req);
  if (!uid) return json({ error: '로그인이 필요해요' }, 401);

  let code: unknown;
  try {
    ({ code } = await req.json());
  } catch {
    return json({ error: 'invalid body' }, 400);
  }
  if (typeof code !== 'string' || code.length < 6) {
    return json({ error: '초대 코드가 올바르지 않아요' }, 400);
  }

  const admin = adminClient();

  // 이미 커플이 있는 유저인지 확인 (couple_members.user_id unique와 이중 방어)
  const { data: existing } = await admin
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', uid)
    .maybeSingle();
  if (existing) return json({ error: 'already_connected' }, 409);

  // 원자적 클레임: 코드가 아직 유효한 커플의 invite_code를 null로 — 성공한 요청 하나만 row를 가져간다
  const { data: claimed, error: claimError } = await admin
    .from('couples')
    .update({ invite_code: null })
    .eq('invite_code', code)
    .select('id')
    .maybeSingle();
  if (claimError) return json({ error: claimError.message }, 500);
  if (!claimed) return json({ error: '유효하지 않거나 이미 사용된 코드예요' }, 404);

  // 멤버 수 확인 후 합류 (발급자 1인이어야 정상)
  const { count } = await admin
    .from('couple_members')
    .select('*', { count: 'exact', head: true })
    .eq('couple_id', claimed.id);
  if ((count ?? 0) >= 2) return json({ error: '이미 두 명이 연결된 커플이에요' }, 409);

  const { error: joinError } = await admin
    .from('couple_members')
    .insert({ couple_id: claimed.id, user_id: uid });
  if (joinError) {
    // 합류 실패 시 코드 복구 (클레임 롤백)
    await admin.from('couples').update({ invite_code: code }).eq('id', claimed.id);
    return json({ error: joinError.message }, 500);
  }

  return json({ couple_id: claimed.id });
});

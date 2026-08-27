// leave-couple — 상대와의 연결을 끊는다.
//
// 남은 한 사람은 기록을 그대로 볼 수 있고, 새 초대 코드를 받아 다시 연결할 수 있다.
// 두 사람이 모두 나가면 그 시점에 커플의 모든 기록과 파일이 파기된다 (_shared/leave.ts).
import { adminClient, callerId, json, preflight } from '../_shared/client.ts';
import { leaveCouple } from '../_shared/leave.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const uid = await callerId(req);
  if (!uid) return json({ error: '로그인이 필요해요' }, 401);

  try {
    const remaining = await leaveCouple(adminClient(), uid);
    if (remaining < 0) return json({ error: '연결된 상대가 없어요' }, 409);
    return json({ remaining });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

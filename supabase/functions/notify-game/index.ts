// notify-game — 오늘의 게임을 처음 마친 순간 상대에게 1건 알린다.
// 호출: 클라이언트(useSubmitRound)가 그날 첫 판(attempts === 1) 성공 후 invoke.
// 부가물이라 실패해도 게임 성립에는 영향이 없다 (클라이언트가 에러를 삼킨다).
import { adminClient, callerId, json, preflight } from '../_shared/client.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  const meId = await callerId(req);
  if (!meId) return json({ error: 'unauthorized' }, 401);

  const admin = adminClient();

  // profiles에는 커플 참조가 없다 — my_couple_id()와 같은 경로(couple_members)를 admin으로 재현
  const { data: myMembership } = await admin
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', meId)
    .maybeSingle();
  if (!myMembership) return json({ pushed: 0 });

  const { data: members } = await admin
    .from('couple_members')
    .select('user_id')
    .eq('couple_id', myMembership.couple_id);
  const partnerId = (members ?? []).map((m) => m.user_id).find((id) => id !== meId);
  if (!partnerId) return json({ pushed: 0 });

  const { data: partner } = await admin
    .from('profiles')
    .select('push_token')
    .eq('id', partnerId)
    .maybeSingle();
  const to = partner?.push_token;
  if (!to) return json({ pushed: 0 });

  const { data: me } = await admin.from('profiles').select('nickname').eq('id', meId).maybeSingle();

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([
      {
        to,
        title: '오늘의 게임 🎮',
        body: `${me?.nickname ?? '상대'}님이 오늘의 게임을 마쳤어요`,
        data: { url: '/game' },
      },
    ]),
  });

  return json({ pushed: 1 });
});

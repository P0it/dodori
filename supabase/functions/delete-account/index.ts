// delete-account — 회원 탈퇴 (App Store 5.1.1(v)·Google Play 요구사항).
//
// 순서가 곧 안전장치다:
//   1) 커플에서 나간다 — 마지막 한 명이면 그 자리에서 커플 기록과 파일이 파기된다
//   2) 아바타 파일을 지운다
//   3) 프로필을 익명화한다 — 남은 상대의 화면에서 게시물·댓글의 작성자 자리가 비지 않게
//   4) 마지막에 auth 계정을 지운다
//
// auth 계정을 먼저 지우면 앞 단계가 실패했을 때 되돌릴 수도, 다시 시도할 수도 없다.
// 계정이 살아 있는 한 사용자는 다시 눌러볼 수 있다.
import { adminClient, callerId, json, preflight } from '../_shared/client.ts';
import { leaveCouple, purgeAvatars } from '../_shared/leave.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const uid = await callerId(req);
  if (!uid) return json({ error: '로그인이 필요해요' }, 401);

  const admin = adminClient();

  try {
    await leaveCouple(admin, uid); // 커플이 없어도(-1) 탈퇴는 계속 진행한다
    await purgeAvatars(admin, uid);

    const { error: anonError } = await admin.rpc('anonymize_profile', { p_user: uid });
    if (anonError) throw anonError;

    const { error: deleteError } = await admin.auth.admin.deleteUser(uid);
    if (deleteError) throw deleteError;

    return json({ deleted: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

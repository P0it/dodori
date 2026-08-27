import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

/**
 * 연결 해제와 계정 삭제가 공유하는 부분 — 커플에서 나가고, 마지막 한 명이면 파일까지 파기한다.
 * 두 Edge Function이 각자 이 순서를 다시 쓰면 한쪽만 고쳐져 파일이 남는 날이 온다.
 */

/** storage.remove에 한 번에 넘길 경로 수 — 커플 하나가 수천 장을 가질 수 있다 */
const REMOVE_BATCH = 100;

async function removeAll(admin: SupabaseClient, bucket: string, paths: string[]) {
  for (let i = 0; i < paths.length; i += REMOVE_BATCH) {
    const { error } = await admin.storage.from(bucket).remove(paths.slice(i, i + REMOVE_BATCH));
    // 파일 삭제가 실패하면 여기서 멈춘다 — DB 행을 먼저 지우면 경로를 알 길이 없어져
    // 지울 수 없는 고아 파일이 용량만 차지한 채 영원히 남는다.
    if (error) throw new Error(`파일을 지우지 못했어요: ${error.message}`);
  }
}

/**
 * 커플에서 나간다. 반환값은 **남은 인원 수**(연결된 커플이 없었으면 -1).
 *
 * 마지막 한 명이 나가는 경우에만 스토리지를 비우고, 그 다음에 DB 행을 지운다.
 * 순서가 뒤집히면 photos 행이 먼저 사라져 어떤 파일을 지워야 할지 알 수 없게 된다.
 */
export async function leaveCouple(admin: SupabaseClient, uid: string): Promise<number> {
  const { data: member } = await admin
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', uid)
    .maybeSingle();
  if (!member) return -1;

  const { count } = await admin
    .from('couple_members')
    .select('*', { count: 'exact', head: true })
    .eq('couple_id', member.couple_id);

  if ((count ?? 0) <= 1) {
    const { data: paths, error } = await admin.rpc('couple_storage_paths', {
      p_couple: member.couple_id,
    });
    if (error) throw error;
    await removeAll(admin, 'photos', (paths ?? []) as string[]);
  }

  const { data: remaining, error } = await admin.rpc('leave_couple', { p_user: uid });
  if (error) throw error;
  return remaining as number;
}

/** 아바타 파일 파기 — 계정 삭제에서만 쓴다 (연결 해제는 계정이 그대로 남는다) */
export async function purgeAvatars(admin: SupabaseClient, uid: string) {
  const { data: paths, error } = await admin.rpc('user_avatar_paths', { p_user: uid });
  if (error) throw error;
  await removeAll(admin, 'avatars', (paths ?? []) as string[]);
}

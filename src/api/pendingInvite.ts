import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * 초대 링크로 들어온 코드 보관.
 * 링크 진입 → 로그인(웹 카카오는 OAuth 리다이렉트로 앱이 새로 뜬다) → 연결까지 살아남아야 해서 영속 저장.
 */
const KEY = 'pendingInviteCode';

export async function savePendingInvite(code: string) {
  await AsyncStorage.setItem(KEY, code);
}

export async function clearPendingInvite() {
  await AsyncStorage.removeItem(KEY);
}

/** 보관된 초대 코드 — 없으면 null. 진입 가드가 연결 화면 분기에 쓴다 */
export function usePendingInvite() {
  return useQuery({
    queryKey: ['pendingInvite'],
    queryFn: () => AsyncStorage.getItem(KEY),
    staleTime: Infinity,
  });
}

/** 저장·삭제 후 가드가 다시 판단하도록 캐시를 깨운다 */
export function useRefreshPendingInvite() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['pendingInvite'] });
}

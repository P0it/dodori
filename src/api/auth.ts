import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

/**
 * 카카오 네이티브 로그인 → Supabase 세션 교환.
 * 카카오 콘솔에서 OpenID Connect 활성화 필수 (idToken 발급 조건).
 * 네이티브 SDK는 dev client 빌드에서만 동작 (Expo Go 불가).
 */
export async function signInWithKakao() {
  const { login } = await import('@react-native-kakao/user');
  const token = await login();
  if (!token.idToken) {
    throw new Error('카카오 idToken이 없어요 — 카카오 콘솔에서 OpenID Connect를 활성화해주세요.');
  }
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'kakao',
    token: token.idToken,
    access_token: token.accessToken,
  });
  if (error) throw error;

  // 첫 로그인 시 프로필 행 보장 (닉네임·프로필 사진은 카카오 프로필에서)
  const user = data.user;
  const nickname =
    (user.user_metadata?.name as string | undefined) ??
    (user.user_metadata?.nickname as string | undefined) ??
    '';
  const avatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ??
    (user.user_metadata?.picture as string | undefined) ??
    null;
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      { id: user.id, nickname, avatar_url: avatarUrl },
      { onConflict: 'id', ignoreDuplicates: false },
    );
  if (profileError) throw profileError;

  return data.session;
}

export function useSignInWithKakao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: signInWithKakao,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session'] }),
  });
}

/** 현재 세션 */
export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
    staleTime: Infinity,
  });
}

/** 루트 레이아웃에서 1회 호출 — auth 변화 시 세션·커플 캐시 무효화 */
export function useAuthListener() {
  const qc = useQueryClient();
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      qc.invalidateQueries({ queryKey: ['session'] });
      qc.invalidateQueries({ queryKey: ['couple'] });
    });
    return () => sub.subscription.unsubscribe();
  }, [qc]);
}

export async function signOut() {
  await supabase.auth.signOut();
}

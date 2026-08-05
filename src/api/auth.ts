import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { clearSignCache } from './signCache';

/**
 * 첫 로그인 시 프로필 행 보장 (닉네임·프로필 사진은 소셜 메타데이터에서).
 * 행이 이미 있으면 손대지 않는다 — 앱에서 고친 이름·사진이 재로그인 때 카카오 값으로 되돌아가면 안 된다.
 */
async function ensureProfile(user: User) {
  const nickname =
    (user.user_metadata?.name as string | undefined) ??
    (user.user_metadata?.nickname as string | undefined) ??
    '';
  const avatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ??
    (user.user_metadata?.picture as string | undefined) ??
    null;
  const { error } = await supabase
    .from('profiles')
    .upsert(
      { id: user.id, nickname, avatar_url: avatarUrl },
      { onConflict: 'id', ignoreDuplicates: true },
    );
  if (error) throw error;
}

/**
 * 카카오 로그인 → Supabase 세션.
 * - 네이티브: 카카오 SDK idToken을 Supabase와 교환 (dev client 빌드 필요, Expo Go 불가).
 *   카카오 콘솔에서 OpenID Connect 활성화 필수 (idToken 발급 조건).
 * - 웹: Supabase 카카오 OAuth로 리다이렉트 — 세션은 복귀 후 detectSessionInUrl이 세우고
 *   프로필 행은 useAuthListener가 보장한다. 그래서 여기선 null을 돌려준다.
 */
export async function signInWithKakao() {
  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      // scope는 지정하지 않는다 — gotrue가 카카오 기본 scope(account_email·profile_image·
      // profile_nickname)에 덧붙이기만 해서 뺄 수 없다. 카카오 콘솔 동의항목을 맞추는 게 유일한 길
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
    return null;
  }
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
  await ensureProfile(data.user);
  return data.session;
}

export function useSignInWithKakao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: signInWithKakao,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session'] }),
  });
}

/**
 * 개발 전용 이메일/비밀번호 로그인 — Expo Go에서 카카오 없이 세션을 얻기 위한 우회로.
 * 로그인 화면의 __DEV__ 블록에서만 노출된다. Supabase 대시보드에 이메일 유저를
 * 미리 만들어 두어야 한다 (Authentication → Users → Add user, auto-confirm).
 */
export async function signInWithEmailDev(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  await ensureProfile(data.user);
  return data.session;
}

export function useSignInWithEmailDev() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      signInWithEmailDev(email, password),
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
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // 웹 OAuth는 리다이렉트로 돌아오며 로그인이 끝나므로 프로필 행 보장이 여기서만 가능하다
      if (event === 'SIGNED_IN' && session) void ensureProfile(session.user);
      qc.invalidateQueries({ queryKey: ['session'] });
      qc.invalidateQueries({ queryKey: ['couple'] });
    });
    return () => sub.subscription.unsubscribe();
  }, [qc]);
}

export async function signOut() {
  // 서명 URL은 로그아웃 뒤에도 유효기간 동안 사진을 열 수 있는 주소다 — 기기에 남기지 않는다
  await clearSignCache();
  await supabase.auth.signOut();
}

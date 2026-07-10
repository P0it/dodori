import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';
import { useSession } from './auth';

/** 초대 코드 생성 — nanoid(10) 동급, 혼동 문자(0/O, 1/l/I) 제외 알파벳 */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function generateInviteCode(length = 10): string {
  const bytes = Crypto.getRandomBytes(length);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

export interface MyCouple {
  coupleId: string;
  startedAt: string | null;
  inviteCode: string | null;
  memberCount: number;
}

/** 내 커플 상태 — 없으면 null (연결 플로우 분기 기준) */
export function useMyCouple() {
  // uid를 키에 포함: 로그아웃 중 캐시된 null이 재로그인 후 분기에 쓰이는 것을 방지
  const session = useSession();
  const uid = session.data?.user.id;
  return useQuery({
    queryKey: ['couple', 'mine', uid],
    enabled: !!uid,
    queryFn: async (): Promise<MyCouple | null> => {
      if (!uid) return null;
      // 연결 후엔 멤버 행이 2개 보이므로 반드시 본인 행으로 한정
      const { data: membership, error } = await supabase
        .from('couple_members')
        .select('couple_id, couples(started_at, invite_code)')
        .eq('user_id', uid)
        .maybeSingle();
      if (error) throw error;
      if (!membership) return null;
      const { count, error: countError } = await supabase
        .from('couple_members')
        .select('*', { count: 'exact', head: true })
        .eq('couple_id', membership.couple_id);
      if (countError) throw countError;
      return {
        coupleId: membership.couple_id,
        startedAt: membership.couples?.started_at ?? null,
        inviteCode: membership.couples?.invite_code ?? null,
        memberCount: count ?? 1,
      };
    },
  });
}

export interface CoupleProfiles {
  me: { id: string; nickname: string; birthday: string | null; avatar_url: string | null } | null;
  partner: {
    id: string;
    nickname: string;
    birthday: string | null;
    avatar_url: string | null;
  } | null;
}

/** 나·상대 프로필 (필터 칩 라벨, 역할 매핑용) */
export function useCoupleProfiles() {
  const couple = useMyCouple();
  return useQuery({
    enabled: !!couple.data,
    queryKey: ['couple', 'profiles'],
    queryFn: async (): Promise<CoupleProfiles> => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nickname, birthday, avatar_url');
      if (error) throw error;
      return {
        me: data.find((p) => p.id === uid) ?? null,
        partner: data.find((p) => p.id !== uid) ?? null,
      };
    },
  });
}

/** 초대 발급 — create_couple RPC (커플 생성 + 본인 등록 원자 처리) */
export function useCreateInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const code = generateInviteCode();
      const { data: coupleId, error } = await supabase.rpc('create_couple', {
        p_invite_code: code,
      });
      if (error) throw error;
      return { id: coupleId as string, invite_code: code };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['couple'] }),
  });
}

/** 초대 수락 — claim-invite Edge Function (검증→멤버 확정→코드 무효화 트랜잭션) */
export function useClaimInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.functions.invoke('claim-invite', {
        body: { code: code.trim().toUpperCase() },
      });
      if (error) {
        // Edge Function이 4xx로 보낸 메시지 추출
        const body = await (error as { context?: Response }).context?.json?.().catch(() => null);
        throw new Error(body?.error ?? error.message);
      }
      return data as { couple_id: string };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['couple'] }),
  });
}

/** 연결 완료 — 시작일·내 생일 저장 + 기념일 자동 생성 (Edge Function이 단일 진실) */
export function useCompleteSetup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { startedAt: string; myBirthday?: string }) => {
      const { data, error } = await supabase.functions.invoke('generate-anniversaries', {
        body: { started_at: input.startedAt, birthday: input.myBirthday ?? null },
      });
      if (error) {
        const body = await (error as { context?: Response }).context?.json?.().catch(() => null);
        throw new Error(body?.error ?? error.message);
      }
      return data as { created: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['couple'] });
      qc.invalidateQueries({ queryKey: ['anniversaries'] });
    },
  });
}

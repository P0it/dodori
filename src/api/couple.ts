import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';
import { useSession } from './auth';
import { givenName } from '@/lib/name';

/** 초대 코드 생성 — nanoid(10) 동급, 혼동 문자(0/O, 1/l/I) 제외 알파벳 */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function generateInviteCode(length = 10): string {
  const bytes = Crypto.getRandomBytes(length);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

export interface MyCouple {
  coupleId: string;
  startedAt: string | null;
  /** 커플 생성 시각 — 오늘의 주제 번호 기준일 (lib/topics) */
  createdAt: string;
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
      /*
        멤버 행을 **한 번에** 가져온다 — 앱을 여는 길목이라 여기서 왕복을 한 번 더 하면
        사진 쿼리가 통째로 그만큼 밀린다 (사진이 늦게 뜨던 원인 중 하나).
        필터를 걸지 않아도 RLS(couple_members_select: couple_id = my_couple_id())가
        내 커플의 멤버 행만 돌려주므로, 행 수가 곧 인원수고 그중 내 행이 멤버십이다.
      */
      const { data: rows, error } = await supabase
        .from('couple_members')
        .select('couple_id, user_id, couples(started_at, invite_code, created_at)');
      if (error) throw error;
      const membership = (rows ?? []).find((r) => r.user_id === uid);
      if (!membership) return null;
      const count = (rows ?? []).filter((r) => r.couple_id === membership.couple_id).length;
      return {
        coupleId: membership.couple_id,
        startedAt: membership.couples?.started_at ?? null,
        createdAt: membership.couples!.created_at,
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

/**
 * 나·상대 프로필 (필터 칩 라벨, 역할 매핑용)
 * nickname은 표시용으로 성을 뗀 이름 — UI 카피는 전부 이름만 쓴다 (givenName)
 */
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
      const display = data.map((p) => ({ ...p, nickname: givenName(p.nickname) }));
      return {
        me: display.find((p) => p.id === uid) ?? null,
        partner: display.find((p) => p.id !== uid) ?? null,
      };
    },
  });
}

/** 내 프로필 원본 — 수정 화면 프리필용(givenName 미적용, 닉네임 원본 그대로) */
export function useMyProfile() {
  const session = useSession();
  const uid = session.data?.user.id;
  return useQuery({
    enabled: !!uid,
    queryKey: ['profile', 'mine', uid],
    queryFn: async (): Promise<{
      nickname: string;
      avatar_url: string | null;
      birthday: string | null;
    }> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('nickname, avatar_url, birthday')
        .eq('id', uid!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

/** 내 프로필 수정 — 닉네임·아바타. 성공 시 모든 아바타·이름 소비처 갱신 */
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      nickname: string;
      avatarUrl?: string | null;
      birthday?: string | null;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error('로그인이 필요해요');
      const patch: { nickname: string; avatar_url?: string | null; birthday?: string | null } = {
        nickname: input.nickname,
      };
      if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl;
      if (input.birthday !== undefined) patch.birthday = input.birthday;
      const { error } = await supabase.from('profiles').update(patch).eq('id', uid);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['couple'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
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
    // 무효화를 기다린다 — 화면이 곧바로 이동하면 가드가 낡은 커플 상태를 보고 되돌려보낸다
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['couple'] }),
        qc.invalidateQueries({ queryKey: ['anniversaries'] }),
      ]);
    },
  });
}

export interface StorageQuota {
  usedBytes: number;
  quotaBytes: number;
  /** 남은 공간 — 업로드 경고가 "남은 공간의 몇 %"를 계산할 때 쓴다 */
  remainingBytes: number;
  /** 한도 도달 — 새 업로드만 막힌다. 이미 올린 것은 그대로 보인다 */
  full: boolean;
}

/**
 * 커플의 보관 공간 사용량 — 업로드 화면에서 잔량을 보여주고 한도에서 막는다.
 * 진짜 강제는 서버(photos insert 트리거)가 하고, 여기는 미리 알려주는 역할이다.
 *
 * 장수가 아니라 바이트로 센다 — 15초 영상 하나가 사진 27장이라 개수로는 셀 수 없다.
 * 합계는 RPC로 받는다(전 행을 내려받아 클라이언트에서 더하지 않는다).
 */
export function useStorageQuota() {
  const couple = useMyCouple();
  const coupleId = couple.data?.coupleId;
  return useQuery({
    enabled: !!coupleId,
    queryKey: ['storageQuota', coupleId],
    queryFn: async (): Promise<StorageQuota> => {
      const [row, used] = await Promise.all([
        supabase.from('couples').select('storage_quota_bytes').eq('id', coupleId!).single(),
        supabase.rpc('storage_used_bytes'),
      ]);
      if (row.error) throw row.error;
      if (used.error) throw used.error;
      const usedBytes = used.data ?? 0;
      const quotaBytes = row.data.storage_quota_bytes;
      return {
        usedBytes,
        quotaBytes,
        remainingBytes: Math.max(0, quotaBytes - usedBytes),
        full: usedBytes >= quotaBytes,
      };
    },
  });
}

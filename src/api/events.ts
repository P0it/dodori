import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useMyCouple } from './couple';
import { useSession } from './auth';
import { upsertPlace, type SearchPlace } from './places';
import type { Database } from '@/types/database.types';
import type { EventColorKey } from '@/theme/tokens';

/** 조회는 events_visible 뷰(커플 공유 읽기 표면) 경유 + 장소는 조인해 이름까지 */
export type VisibleEvent = Database['public']['Views']['events_visible']['Row'] & {
  place?: { id: string; name: string; address: string | null; category: string | null } | null;
};

export interface EventInput {
  title: string;
  /** 일정 주인 — 나/상대 중 선택 (couple_members 중 하나여야 RLS 통과) */
  ownerId: string;
  /** 'YYYY-MM-DD' + 시각은 KST 기준으로 조합해 timestamptz로 저장 */
  startsAt: string; // ISO datetime
  endsAt?: string | null;
  allDay: boolean;
  description?: string | null;
  /** 일정 색 — 사람이 아니라 일정의 속성 (팔레트 키) */
  color: EventColorKey;
  /** 장소 (선택) — 검색 결과면 places에 upsert한 뒤 그 id를 건다 */
  place?: SearchPlace | null;
  /** 이미 places에 있는 곳을 그대로 유지할 때 (수정 모드에서 장소를 안 건드린 경우) */
  placeId?: string | null;
}

/** 입력의 place/placeId를 events.place_id 하나로 접는다 */
async function resolvePlaceId(input: EventInput): Promise<string | null> {
  if (input.place) return upsertPlace(input.place);
  return input.placeId ?? null;
}

/** 월 범위 events 조회 (KST 월 경계, 뷰 경유) */
export function useMonthEvents(monthKey: string) {
  const session = useSession();
  return useQuery({
    // 커플 조회를 기다리지 않는다 — 기다리면 왕복이 직렬로 붙어 화면이 그만큼 늦게 찬다.
    // 어차피 RLS가 내 커플 것만 돌려준다.
    enabled: !!session.data,
    queryKey: ['events', monthKey],
    queryFn: async (): Promise<VisibleEvent[]> => {
      // KST 월 경계 → UTC: KST 1일 00:00 = 전날 15:00Z
      const [y, m] = monthKey.split('-').map(Number);
      const from = new Date(Date.UTC(y, m - 1, 1, -9)).toISOString();
      const to = new Date(Date.UTC(y, m, 1, -9)).toISOString();
      // 여러 날 일정은 지난달에 시작해 이번 달로 넘어올 수 있다 — starts_at만 보면 통째로 사라진다.
      // "이 달이 시작되기 전에 시작했고 아직 안 끝난" 것까지 집는다 (ends_at 없으면 하루짜리).
      const { data, error } = await supabase
        .from('events_visible')
        .select('*, place:places(id, name, address, category)')
        .lt('starts_at', to)
        .or(`ends_at.gte.${from},and(ends_at.is.null,starts_at.gte.${from})`)
        .order('starts_at');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  const couple = useMyCouple();
  return useMutation({
    mutationFn: async (input: EventInput) => {
      if (!couple.data) throw new Error('로그인·연결이 필요해요');
      const { error } = await supabase.from('events').insert({
        couple_id: couple.data.coupleId,
        owner_id: input.ownerId,
        title: input.title,
        starts_at: input.startsAt,
        ends_at: input.endsAt ?? null,
        all_day: input.allDay,
        description: input.description ?? null,
        color: input.color,
        place_id: await resolvePlaceId(input),
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: EventInput & { id: string }) => {
      const { error } = await supabase
        .from('events')
        .update({
          title: input.title,
          owner_id: input.ownerId,
          starts_at: input.startsAt,
          ends_at: input.endsAt ?? null,
          all_day: input.allDay,
          description: input.description ?? null,
          color: input.color,
          place_id: await resolvePlaceId(input),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}


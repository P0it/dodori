import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useMyCouple } from './couple';
import type { Database } from '@/types/database.types';
import type { EventColorKey } from '@/theme/tokens';

/** 조회는 events_visible 뷰(커플 공유 읽기 표면) 경유 */
export type VisibleEvent = Database['public']['Views']['events_visible']['Row'];

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
}

/** 월 범위 events 조회 (KST 월 경계, 뷰 경유) */
export function useMonthEvents(monthKey: string) {
  const couple = useMyCouple();
  return useQuery({
    enabled: !!couple.data,
    queryKey: ['events', monthKey],
    queryFn: async (): Promise<VisibleEvent[]> => {
      // KST 월 경계 → UTC: KST 1일 00:00 = 전날 15:00Z
      const [y, m] = monthKey.split('-').map(Number);
      const from = new Date(Date.UTC(y, m - 1, 1, -9)).toISOString();
      const to = new Date(Date.UTC(y, m, 1, -9)).toISOString();
      const { data, error } = await supabase
        .from('events_visible')
        .select('*')
        .gte('starts_at', from)
        .lt('starts_at', to)
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


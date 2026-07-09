import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useMyCouple } from './couple';
import type { Database } from '@/types/database.types';

/** 조회는 반드시 events_visible 뷰 — 상대의 title_hidden 일정은 '바쁨'으로 치환됨 (§5) */
export type VisibleEvent = Database['public']['Views']['events_visible']['Row'];

export interface EventInput {
  title: string;
  /** 'YYYY-MM-DD' + 시각은 KST 기준으로 조합해 timestamptz로 저장 */
  startsAt: string; // ISO datetime
  endsAt?: string | null;
  allDay: boolean;
  titleHidden: boolean;
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
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid || !couple.data) throw new Error('로그인·연결이 필요해요');
      const { error } = await supabase.from('events').insert({
        couple_id: couple.data.coupleId,
        owner_id: uid,
        title: input.title,
        starts_at: input.startsAt,
        ends_at: input.endsAt ?? null,
        all_day: input.allDay,
        title_hidden: input.titleHidden,
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
          starts_at: input.startsAt,
          ends_at: input.endsAt ?? null,
          all_day: input.allDay,
          title_hidden: input.titleHidden,
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


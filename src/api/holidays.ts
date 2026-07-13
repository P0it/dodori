import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';
import type { ISODate } from '@/lib/date';

/**
 * 임시공휴일·선거일 (date → 이름).
 * 일반 공휴일은 lib/holidays.ts가 계산하므로 여기서 받지 않는다 — 이건 오버레이일 뿐이다.
 * 거의 안 바뀌는 참조 데이터라 오래 캐싱한다. 실패해도 캘린더는 계산값으로 정상 동작한다.
 */
export function useHolidayExtras() {
  return useQuery({
    queryKey: ['holidays_extra'],
    staleTime: 24 * 60 * 60 * 1000, // 하루
    queryFn: async (): Promise<Record<ISODate, string>> => {
      const { data, error } = await supabase.from('holidays_extra').select('date, name');
      if (error) throw error;
      return Object.fromEntries(data.map((h) => [h.date, h.name]));
    },
  });
}

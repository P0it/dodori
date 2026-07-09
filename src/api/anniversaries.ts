import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useMyCouple } from './couple';
import { nextOccurrence } from '@/lib/anniversaries';
import type { ISODate } from '@/lib/date';

export interface AnnivItem {
  id: string;
  type: string;
  label: string;
  /** 원본 날짜 (생일은 생년월일) */
  date: ISODate;
  repeatYearly: boolean;
  /** 다음 발생일 — repeat_yearly면 연 단위 투영, 아니면 원본 */
  nextDate: ISODate;
}

/** 커플 기념일 전체 — 캘린더 마커·Singles·Queue 공용 */
export function useAnniversaries() {
  const couple = useMyCouple();
  return useQuery({
    enabled: !!couple.data,
    queryKey: ['anniversaries'],
    queryFn: async (): Promise<AnnivItem[]> => {
      const { data, error } = await supabase
        .from('anniversaries')
        .select('id, type, label, date, repeat_yearly')
        .order('date');
      if (error) throw error;
      return data.map((a) => ({
        id: a.id,
        type: a.type,
        label: a.label,
        date: a.date,
        repeatYearly: a.repeat_yearly,
        nextDate: a.repeat_yearly ? nextOccurrence(a.date) : a.date,
      }));
    },
  });
}

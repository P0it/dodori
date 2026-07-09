import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useMyCouple } from './couple';

export interface MonthTrack {
  id: string;
  title: string;
  date: string;
  coverThumbUrl: string | null;
}

/** 캘린더 전용 이차원 썸네일 크기 (§6.3: 셀 ≈62px → 124px @2x) */
const CAL_THUMB = { width: 124, height: 124, quality: 60 } as const;

/** storage_path → 캘린더 셀용 변환 썸네일 URL (§6.3 3단계 중 1단계) */
export function calendarThumbUrl(storagePath: string): string {
  const { data } = supabase.storage.from('photos').getPublicUrl(storagePath, {
    transform: { ...CAL_THUMB, resize: 'cover' },
  });
  return data.publicUrl;
}

/** 월의 tracks (+커버 썸네일 경로) — 캘린더 마커·월 플레이리스트 공용 */
export function useMonthTracks(monthKey: string) {
  const couple = useMyCouple();
  return useQuery({
    enabled: !!couple.data,
    queryKey: ['tracks', monthKey],
    queryFn: async (): Promise<MonthTrack[]> => {
      const [y, m] = monthKey.split('-').map(Number);
      const from = `${monthKey}-01`;
      const to = `${m === 12 ? y + 1 : y}-${String((m % 12) + 1).padStart(2, '0')}-01`;
      const { data, error } = await supabase
        .from('tracks')
        .select('id, title, date, cover:photos!tracks_cover_photo_fk(storage_path)')
        .gte('date', from)
        .lt('date', to)
        .order('date');
      if (error) throw error;
      return data.map((t) => ({
        id: t.id,
        title: t.title,
        date: t.date,
        coverThumbUrl: t.cover?.storage_path ? calendarThumbUrl(t.cover.storage_path) : null,
      }));
    },
  });
}

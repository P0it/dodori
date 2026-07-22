import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';
import { todayKST } from '@/lib/date';
import { pickTodaySong, type Song } from '@/lib/song';

/** 전역 곡 풀 — 작고 정적이라 전량 캐시한다 (커플 스코프 없음) */
function useSongPool() {
  return useQuery({
    queryKey: ['songPool'],
    staleTime: 24 * 60 * 60 * 1000,
    queryFn: async (): Promise<Song[]> => {
      const { data, error } = await supabase
        .from('song_pool')
        .select('id, seq, title, artist, artwork_url, preview_url, apple_url')
        .order('seq');
      if (error) throw error;
      return data.map((s) => ({
        id: s.id,
        seq: s.seq,
        title: s.title,
        artist: s.artist,
        artworkUrl: s.artwork_url,
        previewUrl: s.preview_url,
        appleUrl: s.apple_url,
      }));
    },
  });
}

/** 오늘의 추천곡 — 풀 + KST 날짜로 결정된다. 서버 배정도, 픽 저장도 없다 */
export function useTodaySong(): Song | null {
  const pool = useSongPool();
  return pool.data ? pickTodaySong(pool.data, todayKST()) : null;
}

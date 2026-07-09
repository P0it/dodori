import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

export interface SearchPlace {
  naver_id: string;
  name: string;
  category: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  link: string | null;
}

/** 장소 검색 — search-places Edge Function 프록시 (§7.4) */
export function usePlaceSearch(query: string) {
  return useQuery({
    enabled: query.trim().length >= 2,
    queryKey: ['places', 'search', query],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<SearchPlace[]> => {
      const { data, error } = await supabase.functions.invoke('search-places', {
        body: { query },
      });
      if (error) {
        const body = await (error as { context?: Response }).context?.json?.().catch(() => null);
        throw new Error(body?.error ?? error.message);
      }
      return (data as { places: SearchPlace[] }).places;
    },
  });
}

/** 담기 시에만 places upsert(naver_id 기준, §7.4) → place id 반환 */
export async function upsertPlace(p: SearchPlace): Promise<string> {
  const { data, error } = await supabase
    .from('places')
    .upsert(
      {
        naver_id: p.naver_id,
        name: p.name,
        category: p.category,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        link: p.link,
      },
      { onConflict: 'naver_id' },
    )
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

/** 트랙 코스에 장소 추가 */
export function useAddTrackPlace(trackId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { place: SearchPlace; sortOrder: number; visitTime?: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error('로그인이 필요해요');
      const placeId = await upsertPlace(input.place);
      const { error } = await supabase.from('track_places').insert({
        track_id: trackId,
        place_id: placeId,
        sort_order: input.sortOrder,
        visit_time: input.visitTime ?? null,
        added_by: uid,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['track', trackId] }),
  });
}

export function useRemoveTrackPlace(trackId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (placeId: string) => {
      const { error } = await supabase
        .from('track_places')
        .delete()
        .eq('track_id', trackId)
        .eq('place_id', placeId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['track', trackId] }),
  });
}

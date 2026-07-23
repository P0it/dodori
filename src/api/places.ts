import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import type { TrackDetail } from './tracks';

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
    // 찜 탭 담기와 동일한 무효화 집합 — 앨범 캐러셀·목록의 placeCount가 한쪽에서만 낡지 않게.
    // Promise를 돌려줘 코스 리페치가 끝날 때까지 isPending을 유지한다(다음 sortOrder 계산의 근거).
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ['track', trackId] }),
        qc.invalidateQueries({ queryKey: ['tracks'] }),
        qc.invalidateQueries({ queryKey: ['savedPlaces'] }),
      ]),
  });
}

/** 이미 저장된 장소(찜·테마 플리)를 코스에 담기 — upsert 불필요 */
export function useAddSavedPlaceToTrack(trackId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { placeId: string; sortOrder: number }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error('로그인이 필요해요');
      const { error } = await supabase.from('track_places').insert({
        track_id: trackId,
        place_id: input.placeId,
        sort_order: input.sortOrder,
        added_by: uid,
      });
      if (error) throw error;
    },
    // 찜 목록 캐시는 AsyncStorage에 저장돼 살아남는다 — 담긴 뒤에도 낡은 상태로 남지 않게 무효화.
    // Promise를 돌려줘 코스 리페치가 끝날 때까지 isPending을 유지한다(다음 sortOrder 계산의 근거).
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ['track', trackId] }),
        qc.invalidateQueries({ queryKey: ['tracks'] }),
        qc.invalidateQueries({ queryKey: ['savedPlaces'] }),
      ]),
  });
}

/** 코스 순서 변경 — 드롭 시점의 새 순서(placeId[])를 받아 각 행 sort_order = index로 갱신 */
export function useReorderTrackPlaces(trackId: string) {
  const qc = useQueryClient();
  const key = ['track', trackId];
  return useMutation({
    mutationFn: async (orderedPlaceIds: string[]) => {
      for (let i = 0; i < orderedPlaceIds.length; i++) {
        const { error } = await supabase
          .from('track_places')
          .update({ sort_order: i })
          .eq('track_id', trackId)
          .eq('place_id', orderedPlaceIds[i]);
        if (error) throw error;
      }
    },
    // 낙관적: 캐시의 places를 새 순서로 즉시 재정렬 (연타에도 즉각 반응)
    onMutate: async (orderedPlaceIds) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<TrackDetail>(key);
      if (prev) {
        const rank = new Map(orderedPlaceIds.map((id, i) => [id, i]));
        qc.setQueryData<TrackDetail>(key, {
          ...prev,
          places: prev.places
            .map((p) => ({ ...p, sortOrder: rank.get(p.placeId) ?? p.sortOrder }))
            .sort((a, b) => a.sortOrder - b.sortOrder),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
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

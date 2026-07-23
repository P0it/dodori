import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useMyCouple } from './couple';
import { upsertPlace, type SearchPlace } from './places';
import { thumbUrl } from './photos';

export interface PlaylistSummary {
  id: string;
  name: string;
  kind: 'custom' | 'saved';
  placeCount: number;
}

export function usePlaylists() {
  const couple = useMyCouple();
  return useQuery({
    enabled: !!couple.data,
    queryKey: ['playlists'],
    queryFn: async (): Promise<PlaylistSummary[]> => {
      const { data, error } = await supabase
        .from('playlists')
        .select('id, name, kind, playlist_places(place_id)')
        .order('created_at');
      if (error) throw error;
      return data
        .map((p) => ({
          id: p.id,
          name: p.name,
          kind: (p.kind === 'saved' ? 'saved' : 'custom') as 'custom' | 'saved',
          placeCount: p.playlist_places?.length ?? 0,
        }))
        // 찜은 항상 맨 위
        .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'saved' ? -1 : 1));
    },
  });
}

/** 커플의 찜 플레이리스트 id — 트리거가 보장하므로 연결된 커플이면 항상 존재한다 */
export function useSavedPlaylistId(): string | undefined {
  const playlists = usePlaylists();
  return playlists.data?.find((p) => p.kind === 'saved')?.id;
}

export function useCreatePlaylist() {
  const qc = useQueryClient();
  const couple = useMyCouple();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid || !couple.data) throw new Error('로그인·연결이 필요해요');
      const { data, error } = await supabase
        .from('playlists')
        .insert({ couple_id: couple.data.coupleId, name: name.trim(), created_by: uid })
        .select('id')
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['playlists'] }),
  });
}

export function useDeletePlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('playlists').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playlists'] });
      qc.invalidateQueries({ queryKey: ['savedPlaces'] });
    },
  });
}

export interface PlaylistPlaceItem {
  placeId: string;
  name: string;
  category: string | null;
  address: string | null;
  link: string | null;
  visitCount: number;
  photoThumbs: string[];
}

export interface PlaylistDetail {
  id: string;
  name: string;
  /** 찜은 삭제·이름변경 불가 — 화면이 이 값으로 삭제 UI를 감춘다 */
  kind: 'custom' | 'saved';
  places: PlaylistPlaceItem[];
}

/** 테마 플리 상세 — 장소 + 방문 횟수(우리 트랙 기준) + 장소 사진(트랙 사진에서) */
export function usePlaylistDetail(id: string | undefined) {
  const couple = useMyCouple();
  return useQuery({
    enabled: !!id && !!couple.data,
    queryKey: ['playlists', id],
    queryFn: async (): Promise<PlaylistDetail> => {
      const { data: pl, error } = await supabase
        .from('playlists')
        .select('id, name, kind, playlist_places(place_id, places(id, name, category, address, link))')
        .eq('id', id!)
        .single();
      if (error) throw error;
      const placeIds = (pl.playlist_places ?? []).map((pp) => pp.place_id);
      const visits = await visitStats(placeIds);
      return {
        id: pl.id,
        name: pl.name,
        kind: (pl.kind === 'saved' ? 'saved' : 'custom') as 'custom' | 'saved',
        places: (pl.playlist_places ?? []).map((pp) => ({
          placeId: pp.place_id,
          name: pp.places?.name ?? '',
          category: pp.places?.category ?? null,
          address: pp.places?.address ?? null,
          link: pp.places?.link ?? null,
          visitCount: visits.get(pp.place_id)?.count ?? 0,
          photoThumbs: visits.get(pp.place_id)?.thumbs ?? [],
        })),
      };
    },
  });
}

/** 장소별 방문(트랙) 수 + 해당 트랙 사진 썸네일 몇 장 */
async function visitStats(placeIds: string[]) {
  const map = new Map<string, { count: number; thumbs: string[] }>();
  if (!placeIds.length) return map;
  const { data } = await supabase
    .from('track_places')
    .select('place_id, tracks(date, photos!photos_track_id_fkey(storage_path))')
    .in('place_id', placeIds);
  for (const row of data ?? []) {
    const entry = map.get(row.place_id) ?? { count: 0, thumbs: [] };
    entry.count++;
    for (const ph of row.tracks?.photos ?? []) {
      if (entry.thumbs.length < 4) entry.thumbs.push(thumbUrl(ph.storage_path, 'grid'));
    }
    map.set(row.place_id, entry);
  }
  return map;
}

export function useAddPlaylistPlace(playlistId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (place: SearchPlace) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error('로그인이 필요해요');
      const placeId = await upsertPlace(place);
      const { error } = await supabase
        .from('playlist_places')
        .insert({ playlist_id: playlistId, place_id: placeId, added_by: uid });
      if (error && !error.message.includes('duplicate')) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playlists'] });
      // 찜 상세에서 담아도 추천 스트립·장소 피커가 쓰는 savedPlaces가 낡지 않게
      qc.invalidateQueries({ queryKey: ['savedPlaces'] });
    },
  });
}

export function useRemovePlaylistPlace(playlistId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (placeId: string) => {
      const { error } = await supabase
        .from('playlist_places')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('place_id', placeId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playlists'] });
      qc.invalidateQueries({ queryKey: ['savedPlaces'] });
    },
  });
}

export interface PlaceDetailData {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
  link: string | null;
  visitCount: number;
  photoThumbs: string[];
  tracks: { id: string; title: string; date: string }[];
}

/** 장소 상세 — 우리 데이터만 (목업 P2) */
export function usePlaceDetail(id: string | undefined) {
  const couple = useMyCouple();
  return useQuery({
    enabled: !!id && !!couple.data,
    queryKey: ['place', id],
    queryFn: async (): Promise<PlaceDetailData> => {
      const { data: p, error } = await supabase
        .from('places')
        .select('id, name, category, address, link')
        .eq('id', id!)
        .single();
      if (error) throw error;
      const { data: tps } = await supabase
        .from('track_places')
        .select('tracks(id, title, date, photos!photos_track_id_fkey(storage_path))')
        .eq('place_id', id!);
      const tracks = (tps ?? [])
        .map((tp) => tp.tracks)
        .filter((t): t is NonNullable<typeof t> => !!t)
        .sort((a, b) => b.date.localeCompare(a.date));
      const thumbs = tracks
        .flatMap((t) => t.photos ?? [])
        .slice(0, 6)
        .map((ph) => thumbUrl(ph.storage_path, 'grid'));
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        address: p.address,
        link: p.link,
        visitCount: tracks.length,
        photoThumbs: thumbs,
        tracks: tracks.map((t) => ({ id: t.id, title: t.title, date: t.date })),
      };
    },
  });
}

/** 장소 찜 토글 — 찜 플레이리스트에 넣고 뺀다 */
export function useToggleSavedPlace() {
  const qc = useQueryClient();
  const savedId = useSavedPlaylistId();
  return useMutation({
    mutationFn: async ({ placeId, saved }: { placeId: string; saved: boolean }) => {
      if (!savedId) throw new Error('찜 목록을 찾지 못했어요');
      if (saved) {
        const { error } = await supabase
          .from('playlist_places')
          .delete()
          .eq('playlist_id', savedId)
          .eq('place_id', placeId);
        if (error) throw error;
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData.user?.id;
        if (!uid) throw new Error('로그인이 필요해요');
        const { error } = await supabase
          .from('playlist_places')
          .insert({ playlist_id: savedId, place_id: placeId, added_by: uid });
        if (error && !error.message.includes('duplicate')) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playlists'] });
      qc.invalidateQueries({ queryKey: ['savedPlaces'] });
    },
  });
}

/** 검색 결과(아직 places 행이 없는 장소)를 찜에 담기 */
export function useSaveSearchPlace() {
  const qc = useQueryClient();
  const savedId = useSavedPlaylistId();
  return useMutation({
    mutationFn: async (place: SearchPlace) => {
      if (!savedId) throw new Error('찜 목록을 찾지 못했어요');
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error('로그인이 필요해요');
      const placeId = await upsertPlace(place);
      const { error } = await supabase
        .from('playlist_places')
        .insert({ playlist_id: savedId, place_id: placeId, added_by: uid });
      if (error && !error.message.includes('duplicate')) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playlists'] });
      qc.invalidateQueries({ queryKey: ['savedPlaces'] });
    },
  });
}

export interface SavedPlaceItem {
  placeId: string;
  name: string;
  category: string | null;
  address: string | null;
  playlistId: string;
  playlistName: string;
  playlistKind: 'custom' | 'saved';
  savedAt: string;
  /** 우리가 이 장소를 낀 데이트 수 — 추천에서 "이미 가본 곳"을 거르는 근거 */
  visitCount: number;
  photoThumbs: string[];
}

/** 모든 플레이리스트(찜 + 테마)의 장소를 평탄화 — 장소 피커·추천이 함께 쓴다 */
export function useSavedPlaces() {
  const couple = useMyCouple();
  return useQuery({
    enabled: !!couple.data,
    queryKey: ['savedPlaces'],
    queryFn: async (): Promise<SavedPlaceItem[]> => {
      const { data, error } = await supabase
        .from('playlist_places')
        .select(
          'place_id, added_at, playlists(id, name, kind), places(id, name, category, address)',
        );
      if (error) throw error;
      const rows = (data ?? []).filter((r) => r.places && r.playlists);
      const visits = await visitStats(rows.map((r) => r.place_id));
      return rows.map((r) => ({
        placeId: r.place_id,
        name: r.places!.name,
        category: r.places!.category,
        address: r.places!.address,
        playlistId: r.playlists!.id,
        playlistName: r.playlists!.name,
        playlistKind: (r.playlists!.kind === 'saved' ? 'saved' : 'custom') as 'custom' | 'saved',
        savedAt: r.added_at,
        visitCount: visits.get(r.place_id)?.count ?? 0,
        photoThumbs: visits.get(r.place_id)?.thumbs ?? [],
      }));
    },
  });
}

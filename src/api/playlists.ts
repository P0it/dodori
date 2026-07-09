import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useMyCouple } from './couple';
import { upsertPlace, type SearchPlace } from './places';
import { thumbUrl } from './photos';

export interface PlaylistSummary {
  id: string;
  name: string;
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
        .select('id, name, playlist_places(place_id)')
        .order('created_at');
      if (error) throw error;
      return data.map((p) => ({
        id: p.id,
        name: p.name,
        placeCount: p.playlist_places?.length ?? 0,
      }));
    },
  });
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['playlists'] }),
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
        .select('id, name, playlist_places(place_id, places(id, name, category, address, link))')
        .eq('id', id!)
        .single();
      if (error) throw error;
      const placeIds = (pl.playlist_places ?? []).map((pp) => pp.place_id);
      const visits = await visitStats(placeIds);
      return {
        id: pl.id,
        name: pl.name,
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['playlists'] }),
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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useMyCouple } from './couple';
import { thumbUrl } from './photos';
import type { ISODate } from '@/lib/date';

export interface MonthTrack {
  id: string;
  title: string;
  date: string;
  coverThumbUrl: string | null;
}

/** storage_path → 캘린더 셀용 변환 썸네일 URL (§6.3) */
export function calendarThumbUrl(storagePath: string): string {
  return thumbUrl(storagePath, 'calendar');
}

/** 월의 tracks (+커버 썸네일) — 캘린더 마커·월 플레이리스트 공용 */
export function useMonthTracks(monthKey: string) {
  const couple = useMyCouple();
  return useQuery({
    enabled: !!couple.data,
    queryKey: ['tracks', 'month', monthKey],
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

export interface TrackListItem extends MonthTrack {
  photoCount: number;
  noteCount: number;
  placeCount: number;
  liked: boolean;
}

/** 전체 트랙 (최신순) — 플레이리스트 루트·월별 그룹·Favorites 공용 */
export function useAllTracks() {
  const couple = useMyCouple();
  return useQuery({
    enabled: !!couple.data,
    queryKey: ['tracks', 'all'],
    queryFn: async (): Promise<TrackListItem[]> => {
      const { data, error } = await supabase
        .from('tracks')
        .select(
          `id, title, date, liked,
           cover:photos!tracks_cover_photo_fk(storage_path),
           photos!photos_track_id_fkey(id, storage_path),
           notes(id), track_places(place_id)`,
        )
        .order('date', { ascending: false });
      if (error) throw error;
      return data.map((t) => {
        const firstPhoto = t.photos?.[0]?.storage_path ?? null;
        const coverPath = t.cover?.storage_path ?? firstPhoto;
        return {
          id: t.id,
          title: t.title,
          date: t.date,
          liked: t.liked,
          coverThumbUrl: coverPath ? thumbUrl(coverPath, 'grid') : null,
          photoCount: t.photos?.length ?? 0,
          noteCount: t.notes?.length ?? 0,
          placeCount: t.track_places?.length ?? 0,
        };
      });
    },
  });
}

export interface TrackPhoto {
  id: string;
  storagePath: string;
  uploaderId: string;
  takenAt: string | null;
  createdAt: string;
  width: number | null;
  height: number | null;
}
export interface TrackPlace {
  placeId: string;
  name: string;
  category: string | null;
  address: string | null;
  link: string | null;
  visitTime: string | null;
  sortOrder: number;
  addedBy: string;
  done: boolean;
}
export interface TrackNote {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
}
export interface TrackDetail {
  id: string;
  title: string;
  date: string;
  coverPhotoId: string | null;
  coverPhotoPath: string | null;
  liked: boolean;
  createdBy: string;
  photos: TrackPhoto[]; // taken_at(실패 시 created_at) 정렬 (§7.3)
  places: TrackPlace[];
  notes: TrackNote[];
}

export function useTrack(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ['track', id],
    queryFn: async (): Promise<TrackDetail> => {
      const { data: t, error } = await supabase
        .from('tracks')
        .select(
          `id, title, date, cover_photo_id, liked, created_by,
           cover:photos!tracks_cover_photo_fk(storage_path),
           photos!photos_track_id_fkey(id, storage_path, uploader_id, taken_at, created_at, width, height),
           track_places(place_id, visit_time, sort_order, added_by, done, places(name, category, address, link)),
           notes(id, author_id, body, created_at)`,
        )
        .eq('id', id!)
        .single();
      if (error) throw error;
      const photos = (t.photos ?? [])
        .map((p) => ({
          id: p.id,
          storagePath: p.storage_path,
          uploaderId: p.uploader_id,
          takenAt: p.taken_at,
          createdAt: p.created_at,
          width: p.width,
          height: p.height,
        }))
        .sort((a, b) => (a.takenAt ?? a.createdAt).localeCompare(b.takenAt ?? b.createdAt));
      return {
        id: t.id,
        title: t.title,
        date: t.date,
        coverPhotoId: t.cover_photo_id,
        coverPhotoPath: t.cover?.storage_path ?? null,
        liked: t.liked,
        createdBy: t.created_by,
        photos,
        places: (t.track_places ?? [])
          .map((tp) => ({
            placeId: tp.place_id,
            name: tp.places?.name ?? '',
            category: tp.places?.category ?? null,
            address: tp.places?.address ?? null,
            link: tp.places?.link ?? null,
            visitTime: tp.visit_time,
            sortOrder: tp.sort_order,
            addedBy: tp.added_by,
            done: tp.done,
          }))
          .sort((a, b) => a.sortOrder - b.sortOrder),
        notes: (t.notes ?? [])
          .map((n) => ({ id: n.id, authorId: n.author_id, body: n.body, createdAt: n.created_at }))
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      };
    },
  });
}

export function useCreateTrack() {
  const qc = useQueryClient();
  const couple = useMyCouple();
  return useMutation({
    mutationFn: async (input: { date: ISODate; title?: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid || !couple.data) throw new Error('로그인·연결이 필요해요');
      const { data, error } = await supabase
        .from('tracks')
        .insert({
          couple_id: couple.data.coupleId,
          date: input.date,
          title: input.title?.trim() || 'Untitled',
          created_by: uid,
        })
        .select('id')
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tracks'] }),
  });
}

export function useUpdateTrack(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: {
      title?: string;
      coverPhotoId?: string | null;
      liked?: boolean;
      date?: ISODate;
    }) => {
      const { error } = await supabase
        .from('tracks')
        .update({
          ...(patch.title !== undefined && { title: patch.title }),
          ...(patch.coverPhotoId !== undefined && { cover_photo_id: patch.coverPhotoId }),
          ...(patch.liked !== undefined && { liked: patch.liked }),
          ...(patch.date !== undefined && { date: patch.date }),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['track', id] });
      qc.invalidateQueries({ queryKey: ['tracks'] });
    },
  });
}

export function useDeleteTrack(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('tracks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tracks'] }),
  });
}

export function useAddNote(trackId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error('로그인이 필요해요');
      const { error } = await supabase
        .from('notes')
        .insert({ track_id: trackId, author_id: uid, body: body.trim() });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['track', trackId] }),
  });
}

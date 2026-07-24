import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useMyCouple } from './couple';
import { signedThumbUrl, uploadPhotos, type PickedPhoto } from './photos';
import { todayKST, type ISODate } from '@/lib/date';

export interface MonthTrack {
  id: string;
  title: string;
  date: string;
  coverThumbUrl: string | null;
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
      return Promise.all(
        data.map(async (t) => ({
          id: t.id,
          title: t.title,
          date: t.date,
          coverThumbUrl: t.cover?.storage_path
            ? await signedThumbUrl(t.cover.storage_path, 'calendar')
            : null,
        })),
      );
    },
  });
}

export interface TrackListItem extends MonthTrack {
  photoCount: number;
  noteCount: number;
  placeCount: number;
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
          `id, title, date,
           cover:photos!tracks_cover_photo_fk(storage_path),
           photos!photos_track_id_fkey(id, storage_path),
           notes(id), track_places(place_id)`,
        )
        .order('date', { ascending: false });
      if (error) throw error;
      return Promise.all(
        data.map(async (t) => {
          const firstPhoto = t.photos?.[0]?.storage_path ?? null;
          const coverPath = t.cover?.storage_path ?? firstPhoto;
          return {
            id: t.id,
            title: t.title,
            date: t.date,
            coverThumbUrl: coverPath ? await signedThumbUrl(coverPath, 'grid') : null,
            photoCount: t.photos?.length ?? 0,
            noteCount: t.notes?.length ?? 0,
            placeCount: t.track_places?.length ?? 0,
          };
        }),
      );
    },
  });
}

/** 오늘(KST) 날짜의 트랙 — 스토리가 앨범에 자동으로 얹히는 기준 */
export function useTodayTrack() {
  const couple = useMyCouple();
  return useQuery({
    enabled: !!couple.data,
    queryKey: ['tracks', 'today', todayKST()],
    queryFn: async (): Promise<{ id: string; title: string } | null> => {
      const { data, error } = await supabase
        .from('tracks')
        .select('id, title')
        .eq('date', todayKST())
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

export interface TrackPhoto {
  id: string;
  storagePath: string;
  /** 그리드용 서명 썸네일 — 비공개 버킷이라 렌더에는 이 값만 쓴다 */
  thumbUrl: string;
  uploaderId: string;
  takenAt: string | null;
  createdAt: string;
  width: number | null;
  height: number | null;
  /** 스토리에서 흘러온 사진이면 그 스토리 id — 커버 지정·삭제 대상에서 뺀다 */
  storyId: string | null;
}
export interface TrackPlace {
  placeId: string;
  name: string;
  category: string | null;
  address: string | null;
  link: string | null;
  lat: number | null;
  lng: number | null;
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
  coverThumbUrl: string | null;
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
          `id, title, date, cover_photo_id, created_by,
           cover:photos!tracks_cover_photo_fk(storage_path),
           photos!photos_track_id_fkey(id, storage_path, uploader_id, taken_at, created_at, width, height),
           track_places(place_id, visit_time, sort_order, added_by, done, places(name, category, address, link, lat, lng)),
           notes(id, author_id, body, created_at)`,
        )
        .eq('id', id!)
        .single();
      if (error) throw error;
      // 그날 스토리 사진도 앨범이 품는다 — 복사하지 않고 읽을 때 합친다 (스토리 설계 §앨범 연동)
      const { data: stories, error: storyError } = await supabase
        .from('stories')
        .select(
          `id, photos!photos_story_id_fkey(id, storage_path, uploader_id, taken_at, created_at, width, height)`,
        )
        .eq('track_id', id!);
      if (storyError) throw storyError;
      const storyPhotos = (stories ?? []).flatMap((s) =>
        (s.photos ?? []).map((p) => ({ ...p, storyId: s.id })),
      );
      const photos = await Promise.all(
        [...(t.photos ?? []).map((p) => ({ ...p, storyId: null as string | null })), ...storyPhotos]
          .sort((a, b) =>
            (a.taken_at ?? a.created_at).localeCompare(b.taken_at ?? b.created_at),
          )
          .map(async (p) => ({
            id: p.id,
            storagePath: p.storage_path,
            thumbUrl: await signedThumbUrl(p.storage_path, 'grid'),
            uploaderId: p.uploader_id,
            takenAt: p.taken_at,
            createdAt: p.created_at,
            width: p.width,
            height: p.height,
            storyId: p.storyId,
          })),
      );
      return {
        id: t.id,
        title: t.title,
        date: t.date,
        coverPhotoId: t.cover_photo_id,
        coverThumbUrl: t.cover?.storage_path
          ? await signedThumbUrl(t.cover.storage_path, 'grid')
          : null,
        createdBy: t.created_by,
        photos,
        places: (t.track_places ?? [])
          .map((tp) => ({
            placeId: tp.place_id,
            name: tp.places?.name ?? '',
            category: tp.places?.category ?? null,
            address: tp.places?.address ?? null,
            link: tp.places?.link ?? null,
            lat: tp.places?.lat ?? null,
            lng: tp.places?.lng ?? null,
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
      date?: ISODate;
    }) => {
      const { error } = await supabase
        .from('tracks')
        .update({
          ...(patch.title !== undefined && { title: patch.title }),
          ...(patch.coverPhotoId !== undefined && { cover_photo_id: patch.coverPhotoId }),
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

/** 앨범 커버 지정 — 사진 1장 업로드 후 그 photo id를 cover_photo_id로. 계획·발매 양쪽 */
export function useSetTrackCover(trackId: string) {
  const qc = useQueryClient();
  const couple = useMyCouple();
  return useMutation({
    mutationFn: async (photo: PickedPhoto) => {
      const coupleId = couple.data?.coupleId;
      if (!coupleId) throw new Error('연결이 필요해요');
      const [photoId] = await uploadPhotos({ trackId }, coupleId, [photo]);
      const { error } = await supabase
        .from('tracks')
        .update({ cover_photo_id: photoId })
        .eq('id', trackId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['track', trackId] });
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

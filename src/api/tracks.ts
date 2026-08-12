import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useMyCouple } from './couple';
import { signedThumbUrl, signedThumbUrls, uploadPhotos, type PickedPhoto } from './photos';
import { storagePathsFor } from '@/lib/media';
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
        .select(
          `id, title, date,
           cover:photos!tracks_cover_photo_fk(storage_path, renditions),
           photos!photos_track_id_fkey(storage_path, renditions, created_at, cover_only),
           stories(photos!photos_story_id_fkey(storage_path, renditions, created_at))`,
        )
        .gte('date', from)
        .lt('date', to)
        .order('date');
      if (error) throw error;
      // 커버를 먼저 다 고른 뒤 서명은 한 번에 — 트랙마다 낱개로 서명하면 그 달 트랙 수만큼 왕복이 된다
      const picked = data.map((t) => {
        // 지정 커버가 없으면 가장 이른 사진으로 — 그날 담긴 스토리 사진도 후보에 넣는다
        // 표지 전용은 폴백 후보가 아니다 — 커버로 지정된 상태라 여기까지 오지도 않지만,
        // 커버가 해제된 뒤에도 그날 사진인 척 대표가 되면 안 된다
        const fallback = [
          ...(t.photos ?? []).filter((p) => !p.cover_only),
          ...(t.stories ?? []).flatMap((s) => s.photos ?? []),
        ].sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
        return { id: t.id, title: t.title, date: t.date, cover: t.cover ?? fallback ?? null };
      });
      const urls = await signedThumbUrls(
        picked.flatMap((t) =>
          t.cover ? [{ storagePath: t.cover.storage_path, renditions: t.cover.renditions }] : [],
        ),
        'grid',
      );
      return picked.map((t) => ({
        id: t.id,
        title: t.title,
        date: t.date,
        coverThumbUrl: t.cover ? (urls.get(t.cover.storage_path) ?? null) : null,
      }));
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
           cover:photos!tracks_cover_photo_fk(storage_path, renditions),
           photos!photos_track_id_fkey(id, storage_path, renditions, cover_only),
           notes(id), track_places(place_id)`,
        )
        .order('date', { ascending: false });
      if (error) throw error;
      // 표지 전용은 그날의 사진이 아니다 — 사진 수에도, 커버 폴백 후보에도 넣지 않는다
      const picked = data.map((t) => {
        const own = (t.photos ?? []).filter((p) => !p.cover_only);
        return { row: t, own, cover: t.cover ?? own[0] ?? null };
      });
      // 캐러셀 자켓이 화면 폭의 2/3까지 커져서 grid(360)로는 확대돼 보인다 — 커버만 feed(1080)
      const urls = await signedThumbUrls(
        picked.flatMap((p) =>
          p.cover ? [{ storagePath: p.cover.storage_path, renditions: p.cover.renditions }] : [],
        ),
        'feed',
      );
      return picked.map(({ row: t, own, cover }) => ({
        id: t.id,
        title: t.title,
        date: t.date,
        coverThumbUrl: cover ? (urls.get(cover.storage_path) ?? null) : null,
        photoCount: own.length,
        noteCount: t.notes?.length ?? 0,
        placeCount: t.track_places?.length ?? 0,
      }));
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
  /** 미리 구운 렌디션(_360)이 있는지 — 삭제·서명 URL이 이 값으로 갈린다 */
  renditions: boolean;
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
  /**
   * 상세 히어로용 커버 — 화면 폭을 통째로 채우므로 grid(360)가 아니라 feed(1080)로 서명한다.
   * 지정 커버가 없고 사진이 딱 한 장일 때도 여기서 채운다 (그 한 장이 곧 커버라서).
   * 사진 2장 이상·커버 미지정은 null로 두고 콜라주 폴백(resolveCover)에 맡긴다 — 칸이 1/4이라 grid로 충분.
   */
  coverThumbUrl: string | null;
  createdBy: string;
  photos: TrackPhoto[]; // taken_at(실패 시 created_at) 정렬 (§7.3)
  places: TrackPlace[];
  notes: TrackNote[];
}

/** TrackDetail.coverThumbUrl 규칙 — 위 주석 참고 */
async function heroCoverUrl(
  cover: { storage_path: string; renditions: boolean } | null,
  photos: { storagePath: string; renditions: boolean }[],
): Promise<string | null> {
  if (cover) return signedThumbUrl(cover.storage_path, 'feed', cover.renditions);
  if (photos.length === 1) return signedThumbUrl(photos[0].storagePath, 'feed', photos[0].renditions);
  return null;
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
           cover:photos!tracks_cover_photo_fk(storage_path, renditions),
           photos!photos_track_id_fkey(id, storage_path, renditions, uploader_id, taken_at, created_at, width, height, cover_only),
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
          `id, photos!photos_story_id_fkey(id, storage_path, renditions, uploader_id, taken_at, created_at, width, height)`,
        )
        .eq('track_id', id!);
      if (storyError) throw storyError;
      const storyPhotos = (stories ?? []).flatMap((s) =>
        (s.photos ?? []).map((p) => ({ ...p, storyId: s.id })),
      );
      // 표지 전용(자켓으로 구해 온 이미지)은 그날의 사진이 아니라 아카이브·갤러리에서 뺀다.
      // 커버 자체는 t.cover로 따로 읽으므로 히어로는 그대로 나온다.
      const sorted = [
        ...(t.photos ?? [])
          .filter((p) => !p.cover_only)
          .map((p) => ({ ...p, storyId: null as string | null })),
        ...storyPhotos,
      ].sort((a, b) => (a.taken_at ?? a.created_at).localeCompare(b.taken_at ?? b.created_at));
      const gridUrls = await signedThumbUrls(
        sorted.map((p) => ({ storagePath: p.storage_path, renditions: p.renditions })),
        'grid',
      );
      const photos = sorted.map((p) => ({
        id: p.id,
        storagePath: p.storage_path,
        renditions: p.renditions,
        thumbUrl: gridUrls.get(p.storage_path) ?? '',
        uploaderId: p.uploader_id,
        takenAt: p.taken_at,
        createdAt: p.created_at,
        width: p.width,
        height: p.height,
        storyId: p.storyId,
      }));
      return {
        id: t.id,
        title: t.title,
        date: t.date,
        coverPhotoId: t.cover_photo_id,
        coverThumbUrl: await heroCoverUrl(t.cover, photos),
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

/**
 * 지금 커버가 표지 전용 사진이면 지운다 (행 + 스토리지).
 *
 * 표지 전용은 아카이브에 안 보이므로 사용자가 지울 길이 없다 — 커버가 바뀌거나 해제되는
 * 순간 쓰임이 사라지니 여기서 함께 치운다. 그날 사진을 커버로 쓰던 경우는 건드리지 않는다.
 */
async function discardCoverOnlyPhoto(trackId: string) {
  const { data: t } = await supabase
    .from('tracks')
    .select('cover:photos!tracks_cover_photo_fk(id, storage_path, renditions, cover_only)')
    .eq('id', trackId)
    .single();
  const old = t?.cover;
  if (!old?.cover_only) return;
  await supabase.from('photos').delete().eq('id', old.id);
  await supabase.storage
    .from('photos')
    .remove(storagePathsFor({ storagePath: old.storage_path, renditions: old.renditions }));
}

export function useUpdateTrack(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: {
      title?: string;
      coverPhotoId?: string | null;
      date?: ISODate;
    }) => {
      // 커버가 바뀌는 갱신이면 먼저 옛 표지를 치운다 (cover_photo_id는 on delete set null이 아니라
      // 지운 뒤에 새 값을 넣어야 순서가 안전하다)
      if (patch.coverPhotoId !== undefined) await discardCoverOnlyPhoto(id);
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
      qc.invalidateQueries({ queryKey: ['storageQuota'] });
    },
  });
}

/**
 * 앨범 커버 지정 — 이미지 1장 업로드 후 그 photo id를 cover_photo_id로. 계획·발매 양쪽.
 *
 * 여기로 올라오는 건 **표지 전용**이다 (cover_only). 사진이 아직 없는 앞으로의 데이트에
 * 커버부터 정하는 흐름이라, 그날 찍은 사진이 아니라 자켓으로 구해 온 이미지다 —
 * 아카이브·갤러리·장소의 '우리 사진'에 섞이면 안 된다.
 * 그날 사진 하나를 커버로 삼는 건 갤러리에서 길게 눌러 지정하는 쪽(useUpdateTrack)이다.
 */
export function useSetTrackCover(trackId: string) {
  const qc = useQueryClient();
  const couple = useMyCouple();
  return useMutation({
    mutationFn: async (photo: PickedPhoto) => {
      const coupleId = couple.data?.coupleId;
      if (!coupleId) throw new Error('연결이 필요해요');
      await discardCoverOnlyPhoto(trackId);
      const [photoId] = await uploadPhotos({ trackId }, coupleId, [photo], { coverOnly: true });
      const { error } = await supabase
        .from('tracks')
        .update({ cover_photo_id: photoId })
        .eq('id', trackId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['track', trackId] });
      qc.invalidateQueries({ queryKey: ['tracks'] });
      qc.invalidateQueries({ queryKey: ['storageQuota'] });
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

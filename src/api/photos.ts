import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';
import { useMyCouple } from './couple';

/**
 * 썸네일 3단계 (§6.3): 캘린더 124@2x / 그리드·스트립 360 / 뷰어 원본.
 * 원본은 뷰어 전용 — 목록 화면에서 원본 URL 사용 금지 (§9)
 */
export const THUMB = {
  calendar: { width: 124, height: 124, quality: 60 },
  grid: { width: 360, height: 360, quality: 70 },
} as const;

export function thumbUrl(storagePath: string, kind: keyof typeof THUMB): string {
  const { data } = supabase.storage.from('photos').getPublicUrl(storagePath, {
    transform: { ...THUMB[kind], resize: 'cover' },
  });
  return data.publicUrl;
}

/** 뷰어용 원본 — 비공개 버킷이므로 서명 URL */
export async function originalUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('photos')
    .createSignedUrl(storagePath, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

export interface PickedPhoto {
  uri: string;
  width: number;
  height: number;
  takenAt: string | null;
}

/** 갤러리에서 다중 선택 + EXIF 촬영시각 추출 (§7.3) */
export async function pickPhotos(limit = 20): Promise<PickedPhoto[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('사진 접근 권한이 필요해요');
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: limit,
    exif: true,
    quality: 1,
  });
  if (res.canceled) return [];
  return res.assets.map((a) => ({
    uri: a.uri,
    width: a.width,
    height: a.height,
    takenAt: parseExifDate(a.exif),
  }));
}

/** EXIF DateTimeOriginal('2026:07:04 15:22:10', KST 로컬 촬영시각) → ISO */
export function parseExifDate(exif: Record<string, unknown> | null | undefined): string | null {
  const raw =
    (exif?.DateTimeOriginal as string | undefined) ?? (exif?.DateTime as string | undefined);
  if (!raw || typeof raw !== 'string') return null;
  const m = raw.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}+09:00`;
}

/** 업로드 전 리사이즈: 장변 2048px + JPEG 80 (§7.3) */
async function resizeForUpload(photo: PickedPhoto) {
  const landscape = photo.width >= photo.height;
  const needResize = Math.max(photo.width, photo.height) > 2048;
  const ctx = ImageManipulator.ImageManipulator.manipulate(photo.uri);
  if (needResize) ctx.resize(landscape ? { width: 2048 } : { height: 2048 });
  const rendered = await ctx.renderAsync();
  const result = await rendered.saveAsync({
    format: ImageManipulator.SaveFormat.JPEG,
    compress: 0.8,
  });
  return result; // { uri, width, height }
}

/** 트랙에 사진 업로드 — 경로 {couple_id}/{track_id}/{uuid}.jpg (§7.3) */
export function useUploadPhotos(trackId: string) {
  const qc = useQueryClient();
  const couple = useMyCouple();
  return useMutation({
    mutationFn: async (photos: PickedPhoto[]) => {
      const coupleId = couple.data?.coupleId;
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!coupleId || !uid) throw new Error('로그인·연결이 필요해요');

      let uploaded = 0;
      for (const photo of photos) {
        const resized = await resizeForUpload(photo);
        const path = `${coupleId}/${trackId}/${Crypto.randomUUID()}.jpg`;
        const file = await fetch(resized.uri);
        const body = await file.arrayBuffer();
        const { error: upError } = await supabase.storage
          .from('photos')
          .upload(path, body, { contentType: 'image/jpeg' });
        if (upError) throw upError;
        const { error: rowError } = await supabase.from('photos').insert({
          track_id: trackId,
          uploader_id: uid,
          storage_path: path,
          width: resized.width,
          height: resized.height,
          taken_at: photo.takenAt,
        });
        if (rowError) throw rowError;
        uploaded++;
      }
      return uploaded;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['track', trackId] });
      qc.invalidateQueries({ queryKey: ['tracks'] });
    },
  });
}

/** 본인 사진 삭제 (row + storage) */
export function useDeletePhoto(trackId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photo: { id: string; storagePath: string }) => {
      const { error } = await supabase.from('photos').delete().eq('id', photo.id);
      if (error) throw error;
      await supabase.storage.from('photos').remove([photo.storagePath]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['track', trackId] });
      qc.invalidateQueries({ queryKey: ['tracks'] });
    },
  });
}

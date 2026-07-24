import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';
import { useMyCouple } from './couple';

/**
 * 썸네일 3단계 (§6.3): 캘린더 124@2x / 그리드·스트립 360 / 뷰어 원본.
 * 피드(feed)는 원본 비율 보존 — 높이 미지정으로 가로세로가 안 잘린다.
 * 원본은 뷰어 전용 — 목록 화면에서 원본 URL 사용 금지 (§9)
 */
export const THUMB = {
  calendar: { width: 124, height: 124, quality: 60 },
  grid: { width: 360, height: 360, quality: 70 },
  feed: { width: 1080, quality: 72 },
} as const;

/**
 * 비율 보존의 열쇠는 height를 안 주는 것 — width만 제약하면 세로가 안 잘린다.
 * (resize는 storage-js 기본값이 이미 'cover'라 명시는 height 있는 변형의 의도 표기용)
 */
function transformFor(kind: keyof typeof THUMB) {
  const t = THUMB[kind];
  return 'height' in t ? { ...t, resize: 'cover' as const } : { ...t };
}

/**
 * 썸네일 서명 URL — photos 버킷이 비공개라 public URL은 렌더되지 않는다.
 * (getPublicUrl로 만든 주소는 401로 떨어져 이미지가 통째로 빈 칸이 된다 — 절대 쓰지 않는다)
 */
export async function signedThumbUrl(
  storagePath: string,
  kind: keyof typeof THUMB,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from('photos')
    .createSignedUrl(storagePath, 60 * 60, { transform: transformFor(kind) });
  if (error) throw error;
  return data.signedUrl;
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

/**
 * 프로필 사진 고르기 → 512 정사각 JPEG 로컬 파일 uri 반환. 취소하면 null.
 * 업로드는 저장 시점에(uploadAvatar) — 안 고르거나 저장을 안 하면 스토리지에 아무것도 안 남는다.
 * allowsEditing으로 정사각 크롭을 강제한다.
 */
export async function pickAvatarImage(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('사진 접근 권한이 필요해요');
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });
  if (res.canceled) return null;
  const ctx = ImageManipulator.ImageManipulator.manipulate(res.assets[0].uri);
  ctx.resize({ width: 512, height: 512 });
  const rendered = await ctx.renderAsync();
  const out = await rendered.saveAsync({ format: ImageManipulator.SaveFormat.JPEG, compress: 0.8 });
  return out.uri;
}

/** 로컬 아바타 이미지를 avatars(공개) 버킷에 업로드 → 공개 URL 반환 */
export async function uploadAvatar(localUri: string): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error('로그인이 필요해요');
  const path = `${uid}/${Crypto.randomUUID()}.jpg`;
  const body = await (await fetch(localUri)).arrayBuffer();
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, body, { contentType: 'image/jpeg' });
  if (error) throw error;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
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

/** 사진의 부모 — 트랙(데이트)·post(게시물)·story(스토리). photos 테이블은 셋 중 하나만 가진다 */
export type PhotoParent =
  | { trackId: string; postId?: never; storyId?: never }
  | { postId: string; trackId?: never; storyId?: never }
  | { storyId: string; trackId?: never; postId?: never };

/**
 * 부모(트랙 또는 게시물)에 사진 업로드 — 경로 {couple_id}/{parent_id}/{uuid}.jpg (§7.3).
 * 부모를 방금 만든 직후에도 쓸 수 있도록 훅이 아닌 함수 (게시물 작성 플로우).
 */
export async function uploadPhotos(
  parent: PhotoParent,
  coupleId: string,
  photos: PickedPhoto[],
): Promise<string[]> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error('로그인이 필요해요');
  const parentId = parent.trackId ?? parent.postId ?? parent.storyId!;

  const ids: string[] = [];
  for (const photo of photos) {
    const resized = await resizeForUpload(photo);
    const path = `${coupleId}/${parentId}/${Crypto.randomUUID()}.jpg`;
    const file = await fetch(resized.uri);
    const body = await file.arrayBuffer();
    const { error: upError } = await supabase.storage
      .from('photos')
      .upload(path, body, { contentType: 'image/jpeg' });
    if (upError) throw upError;
    const { data: row, error: rowError } = await supabase
      .from('photos')
      .insert({
        track_id: parent.trackId ?? null,
        post_id: parent.postId ?? null,
        story_id: parent.storyId ?? null,
        uploader_id: uid,
        storage_path: path,
        width: resized.width,
        height: resized.height,
        taken_at: photo.takenAt,
      })
      .select('id')
      .single();
    if (rowError) throw rowError;
    ids.push(row.id);
  }
  return ids;
}

/** 트랙 사진 추가 (트랙 상세) */
export function useUploadPhotos(parent: PhotoParent) {
  const qc = useQueryClient();
  const couple = useMyCouple();
  return useMutation({
    mutationFn: async (photos: PickedPhoto[]) => {
      const coupleId = couple.data?.coupleId;
      if (!coupleId) throw new Error('연결이 필요해요');
      return uploadPhotos(parent, coupleId, photos);
    },
    onSuccess: () => {
      if (parent.trackId) {
        qc.invalidateQueries({ queryKey: ['track', parent.trackId] });
        qc.invalidateQueries({ queryKey: ['tracks'] });
      } else {
        qc.invalidateQueries({ queryKey: ['posts'] });
      }
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

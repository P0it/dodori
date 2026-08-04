import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Crypto from 'expo-crypto';
import { coverScale, cropRect } from '@/lib/stories';
import { supabase } from './supabase';
import { useMyCouple } from './couple';

/**
 * 렌디션 2종 — 업로드할 때 기기에서 만들어 함께 올린다.
 *
 * 서버 이미지 변환(Storage Image Transformations)은 Pro에서 원본 100장까지만 무료라
 * Spend Cap을 켜면 곧 기능이 제한된다 — 앱 전체 사진이 안 보이게 된다. 그래서 쓰지 않는다.
 * 본체(feed)가 곧 최대본이다 — 2048px "원본" 계층은 폐기했다.
 * 캘린더 칸도 grid(360)를 받아 화면에서 줄여 그린다 (124 렌디션은 폐기).
 */
export const RENDITION = {
  feed: { width: 1080, compress: 0.8 },
  grid: { width: 360, compress: 0.7 },
} as const;

export type RenditionKind = keyof typeof RENDITION;

/** 목록 렌디션의 경로 — 본체가 `{uuid}.jpg`면 `{uuid}_360.jpg` */
export function renditionPath(storagePath: string, kind: RenditionKind): string {
  return kind === 'feed' ? storagePath : storagePath.replace(/\.jpg$/, '_360.jpg');
}

/**
 * 사진 하나가 스토리지에 실제로 차지하는 경로 전부.
 * 삭제할 때 이걸 안 쓰면 _360이 고아 파일로 남는다.
 */
export function storagePathsFor(photo: { storagePath: string; renditions: boolean }): string[] {
  return photo.renditions
    ? [photo.storagePath, renditionPath(photo.storagePath, 'grid')]
    : [photo.storagePath];
}

/**
 * 렌디션 서명 URL — photos 버킷이 비공개라 public URL은 렌더되지 않는다.
 * (getPublicUrl로 만든 주소는 401로 떨어져 이미지가 통째로 빈 칸이 된다 — 절대 쓰지 않는다)
 *
 * renditions=true(신규 업로드)는 미리 구운 파일 경로를 그대로 서명한다.
 * false(옛 사진)는 _360 파일이 없어 서버 변환으로 폴백한다 — Pro에서만 동작하며 대상이 소수라
 * 무료분 안이다. 폴백 대상이 늘지 않으므로 시간이 지나면 저절로 사라지는 분기다.
 */
export async function signedThumbUrl(
  storagePath: string,
  kind: RenditionKind,
  renditions = false,
): Promise<string> {
  const path = renditions ? renditionPath(storagePath, kind) : storagePath;
  const options = renditions
    ? undefined
    : { transform: { width: RENDITION[kind].width, quality: 72 } };
  const { data, error } = await supabase.storage
    .from('photos')
    .createSignedUrl(path, 60 * 60, options);
  if (error) throw error;
  return data.signedUrl;
}

/**
 * 여러 장의 서명 URL을 한 번에 — 화면 첫 진입이 느린 진짜 원인이 여기 있었다.
 *
 * signedThumbUrl은 사진 한 장당 요청 1건이라, 게시물 10개×사진 3장이면 40건이 다 끝나야
 * 쿼리가 resolve된다(그동안 화면은 빈 상태). createSignedUrls는 경로 목록을 통째로 받아
 * **요청 1건**으로 끝낸다.
 *
 * 다만 복수 API에는 transform 옵션이 없다 — 그래서 옛 사진(renditions=false)만 낱개로 남는다.
 * 신규 업로드는 전부 renditions=true라 이 갈래는 시간이 지나면 비어 간다.
 *
 * 반환은 storagePath -> 서명 URL. 서명에 실패한 항목은 키가 없다(호출부에서 null 처리).
 */
export async function signedThumbUrls(
  photos: { storagePath: string; renditions: boolean }[],
  kind: RenditionKind,
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const baked = photos.filter((p) => p.renditions);
  const legacy = photos.filter((p) => !p.renditions);

  if (baked.length) {
    // 같은 사진이 여러 번 들어와도 서명은 한 번만
    const byRendition = new Map<string, string>();
    for (const p of baked) byRendition.set(renditionPath(p.storagePath, kind), p.storagePath);
    const { data, error } = await supabase.storage
      .from('photos')
      .createSignedUrls([...byRendition.keys()], 60 * 60);
    if (error) throw error;
    for (const item of data) {
      const origin = item.path ? byRendition.get(item.path) : undefined;
      if (origin && item.signedUrl) out.set(origin, item.signedUrl);
    }
  }

  await Promise.all(
    legacy.map(async (p) => {
      const url = await signedThumbUrl(p.storagePath, kind, false);
      out.set(p.storagePath, url);
    }),
  );
  return out;
}

export interface PickedPhoto {
  uri: string;
  width: number;
  height: number;
  takenAt: string | null;
}

/**
 * 갤러리에서 사진 고르기 + EXIF 촬영시각 추출 (§7.3).
 * limit이 1이면 다중 선택 UI를 아예 끈다 — 켜 두면 한 장만 받으면서도
 * "여러 장 고르기" 화면이 떠서 고르고 나서 확인을 한 번 더 눌러야 한다.
 */
export async function pickPhotos(limit = 20): Promise<PickedPhoto[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('사진 접근 권한이 필요해요');
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: limit > 1,
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

/** 업로드용 렌디션 하나 만들기 — 장변을 제한한다 (원본이 더 작으면 그대로) */
async function renderRendition(photo: PickedPhoto, kind: RenditionKind) {
  const { width, compress } = RENDITION[kind];
  const landscape = photo.width >= photo.height;
  const ctx = ImageManipulator.ImageManipulator.manipulate(photo.uri);
  if (Math.max(photo.width, photo.height) > width) {
    ctx.resize(landscape ? { width } : { height: width });
  }
  const rendered = await ctx.renderAsync();
  return rendered.saveAsync({ format: ImageManipulator.SaveFormat.JPEG, compress });
}

/**
 * 스토리 편집 캔버스에 보이던 만큼만 잘라낸다 — 변환값을 저장하는 대신 여기서 확정한다.
 * 이래야 뷰어·피드·보관함이 크롭을 몰라도 되고, 텍스트의 0~1 좌표가 그대로 맞는다.
 */
export async function cropToCanvas(
  photo: PickedPhoto,
  crop: { canvasWidth: number; canvasHeight: number; scale: number; tx: number; ty: number },
): Promise<PickedPhoto> {
  const r = cropRect(
    photo.width,
    photo.height,
    crop.canvasWidth,
    crop.canvasHeight,
    crop.scale,
    crop.tx,
    crop.ty,
  );
  if (r.width <= 0 || r.height <= 0) return photo;
  const ctx = ImageManipulator.ImageManipulator.manipulate(photo.uri);
  ctx.crop({ originX: r.x, originY: r.y, width: r.width, height: r.height });
  const rendered = await ctx.renderAsync();
  const out = await rendered.saveAsync({
    format: ImageManipulator.SaveFormat.JPEG,
    compress: 0.9,
  });
  return { uri: out.uri, width: out.width, height: out.height, takenAt: photo.takenAt };
}

/**
 * 스토리 편집 화면에서 사진 뒤에 까는 흐린 배경.
 * 화면에 그리는 쪽과 구워내는 쪽이 **같은 값**을 봐야 편집 화면과 결과가 어긋나지 않는다.
 */
export const STORY_BACKDROP = { blurRadius: 28, scrim: 'rgba(0,0,0,0.32)' } as const;

function drawCentered(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  cx: number,
  cy: number,
  w: number,
  h: number,
) {
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
}

/**
 * 웹용 굽기 — 네이티브의 `captureRef`에 해당한다.
 *
 * 편집 화면과 같은 순서(흐린 배경 → 스크림 → 사진)로 `<canvas>`에 직접 그려 한 장으로 만든다.
 * 사진을 cover 밑으로 줄인 구도는 잘라내기로 표현할 수 없어서(잘라낸 조각에는 여백도 블러도 없다)
 * 웹에도 굽는 길이 필요하다.
 */
export async function composeStoryCanvas(
  photo: PickedPhoto,
  crop: { canvasWidth: number; canvasHeight: number; scale: number; tx: number; ty: number },
): Promise<PickedPhoto> {
  const { canvasWidth: w, canvasHeight: h } = crop;
  const dpr = Math.min(3, globalThis.devicePixelRatio || 2);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return photo;

  const img = new window.Image();
  img.src = photo.uri;
  await img.decode();

  ctx.scale(dpr, dpr);
  const cover = coverScale(photo.width, photo.height, w, h);

  // 1) 흐린 배경. 블러는 가장자리 밖까지 번지므로 넉넉히 키워 그린다 —
  //    딱 맞게 그리면 네 변에 옅은 띠가 남는다
  const bleed = cover * 1.25;
  ctx.filter = `blur(${STORY_BACKDROP.blurRadius}px)`;
  drawCentered(ctx, img, w / 2, h / 2, photo.width * bleed, photo.height * bleed);
  ctx.filter = 'none';

  // 2) 스크림 — 배경이 사진보다 튀지 않게
  ctx.fillStyle = STORY_BACKDROP.scrim;
  ctx.fillRect(0, 0, w, h);

  // 3) 사진 — 편집 화면의 변환값 그대로. 배율은 cover 대비, 중심은 캔버스 중심 + 이동량
  const s = cover * crop.scale;
  drawCentered(ctx, img, w / 2 + crop.tx, h / 2 + crop.ty, photo.width * s, photo.height * s);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.92),
  );
  if (!blob) return photo;
  return {
    uri: URL.createObjectURL(blob),
    width: canvas.width,
    height: canvas.height,
    takenAt: photo.takenAt,
  };
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
    const path = `${coupleId}/${parentId}/${Crypto.randomUUID()}.jpg`;
    const main = await renderRendition(photo, 'feed');
    const small = await renderRendition(photo, 'grid');

    for (const [p, out] of [
      [path, main],
      [renditionPath(path, 'grid'), small],
    ] as const) {
      const body = await (await fetch(out.uri)).arrayBuffer();
      const { error: upError } = await supabase.storage
        .from('photos')
        .upload(p, body, { contentType: 'image/jpeg' });
      if (upError) throw upError;
    }

    const { data: row, error: rowError } = await supabase
      .from('photos')
      .insert({
        track_id: parent.trackId ?? null,
        post_id: parent.postId ?? null,
        story_id: parent.storyId ?? null,
        uploader_id: uid,
        couple_id: coupleId,
        storage_path: path,
        renditions: true,
        width: main.width,
        height: main.height,
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
      qc.invalidateQueries({ queryKey: ['photoQuota'] });
    },
  });
}

/** 본인 사진 삭제 (row + storage) */
export function useDeletePhoto(trackId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photo: { id: string; storagePath: string; renditions: boolean }) => {
      const { error } = await supabase.from('photos').delete().eq('id', photo.id);
      if (error) throw error;
      await supabase.storage.from('photos').remove(storagePathsFor(photo));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['track', trackId] });
      qc.invalidateQueries({ queryKey: ['tracks'] });
      qc.invalidateQueries({ queryKey: ['photoQuota'] });
    },
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Crypto from 'expo-crypto';
import { createVideoPlayer } from 'expo-video';
import { coverScale, cropRect } from '@/lib/stories';
import {
  renditionPath,
  storagePathsFor,
  VIDEO_MAX_MS,
  WEB_VIDEO_MAX_BYTES,
  type RenditionKind,
} from '@/lib/media';
import { supabase } from './supabase';
import { cachedSign, putSign, readySigns, SIGN_TTL_SEC } from './signCache';
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

/**
 * 사진 파일의 Cache-Control (초).
 *
 * 경로가 uuid라 같은 주소의 내용이 바뀌는 일이 없다 — 기본값(storage-js `DEFAULT_FILE_OPTIONS`의
 * 3600초)을 두면 한 시간마다 브라우저가 재검증 왕복을 한 번씩 한다. 1년으로 늘려 그걸 없앤다.
 * 이미 올라간 사진에는 적용되지 않는다(파일 메타데이터라 새 업로드부터).
 */
const PHOTO_CACHE_SEC = String(365 * 24 * 60 * 60);

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
  await readySigns();
  const path = renditions ? renditionPath(storagePath, kind) : storagePath;
  const cached = cachedSign(`${kind}:${path}`);
  if (cached) return cached;
  const options = renditions
    ? undefined
    : { transform: { width: RENDITION[kind].width, quality: 72 } };
  const { data, error } = await supabase.storage
    .from('photos')
    .createSignedUrl(path, SIGN_TTL_SEC, options);
  if (error) throw error;
  return putSign(`${kind}:${path}`, data.signedUrl);
}

/**
 * 영상 본체(mp4) 재생용 서명 — 렌디션 매핑 없이 **경로 그대로** 서명한다.
 * 그림(포스터)은 signedThumbUrls가 맡는다. 캐시 키를 `src:`로 나눠 둘이 섞이지 않게 한다.
 */
export async function signedSourceUrls(paths: string[]): Promise<Map<string, string>> {
  await readySigns();
  const out = new Map<string, string>();
  const need: string[] = [];
  for (const p of paths) {
    const cached = cachedSign(`src:${p}`);
    if (cached) out.set(p, cached);
    else if (!need.includes(p)) need.push(p);
  }
  if (need.length) {
    const { data, error } = await supabase.storage
      .from('photos')
      .createSignedUrls(need, SIGN_TTL_SEC);
    if (error) throw error;
    for (const item of data) {
      if (item.path && item.signedUrl) out.set(item.path, putSign(`src:${item.path}`, item.signedUrl));
    }
  }
  return out;
}

/** 서명 배치가 받는 최소 형태 — 어느 테이블에서 왔든 이 둘만 있으면 된다 */
export interface PhotoRef {
  storagePath: string;
  renditions: boolean;
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
  photos: PhotoRef[],
  kind: RenditionKind,
): Promise<Map<string, string>> {
  await readySigns();
  const out = new Map<string, string>();
  const baked = photos.filter((p) => p.renditions);
  const legacy = photos.filter((p) => !p.renditions);

  if (baked.length) {
    // 같은 사진이 여러 번 들어와도 서명은 한 번만
    const byRendition = new Map<string, string>();
    for (const p of baked) {
      const path = renditionPath(p.storagePath, kind);
      const cached = cachedSign(`${kind}:${path}`);
      // 아직 유효한 서명이 있으면 요청에 넣지 않는다 — 전부 캐시면 왕복 자체가 없다
      if (cached) out.set(p.storagePath, cached);
      else byRendition.set(path, p.storagePath);
    }
    if (byRendition.size) {
      const { data, error } = await supabase.storage
        .from('photos')
        .createSignedUrls([...byRendition.keys()], SIGN_TTL_SEC);
      if (error) throw error;
      for (const item of data) {
        const origin = item.path ? byRendition.get(item.path) : undefined;
        if (origin && item.signedUrl) out.set(origin, putSign(`${kind}:${item.path!}`, item.signedUrl));
      }
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
  /**
   * 영상이면 **포스터** 기준 크기다 — asset이 주는 크기가 아니다.
   * iOS 세로 영상은 ImagePicker가 회전 변환 전 1920×1080을 주는 경우가 있어,
   * 그대로 쓰면 세로 영상에 가로 프레임이 씌워진다. 포스터 비트맵은 회전이 적용된 뒤라 항상 옳다.
   */
  width: number;
  height: number;
  takenAt: string | null;
  /** 있으면 이 항목은 동영상 — `uri`는 재생용 원본이고, 그림이 필요한 곳은 `posterUri`를 쓴다 */
  video?: { posterUri: string; durationMs: number };
}

/**
 * 갤러리에서 사진 고르기 + EXIF 촬영시각 추출 (§7.3).
 * limit이 1이면 다중 선택 UI를 아예 끈다 — 켜 두면 한 장만 받으면서도
 * "여러 장 고르기" 화면이 떠서 고르고 나서 확인을 한 번 더 눌러야 한다.
 *
 * **사진 권한은 요청하지 않는다.** iOS는 PHPicker, 안드로이드는 사진 선택도구를 쓰는데
 * 둘 다 앱 밖에서 도는 시스템 화면이라 권한이 필요 없다. 굳이 물으면 권한 알림이
 * 한 겹 끼고, "선택한 사진만" 을 고른 사용자는 이후 매번 "선택 항목 관리" 를 거친다 —
 * 갤러리로 바로 들어가지 못하는 원인이었다.
 */
export async function pickPhotos(
  limit = 20,
  /** 동영상까지 고를 수 있게 한다 — 스토리·게시물만 켠다 (트랙 사진·커버는 사진 전용) */
  opts?: { videos?: boolean },
): Promise<PickedPhoto[]> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: opts?.videos ? ['images', 'videos'] : ['images'],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    exif: true,
    quality: 1,
  });
  if (res.canceled) return [];

  const picked: PickedPhoto[] = [];
  for (const a of res.assets) {
    if (a.type === 'video') picked.push(await pickedVideo(a));
    else
      picked.push({
        uri: a.uri,
        width: a.width,
        height: a.height,
        takenAt: parseExifDate(a.exif),
      });
  }
  return picked;
}

/**
 * 고른 영상 하나를 PickedPhoto로 — 포스터를 **선택 시점에** 굽는다.
 *
 * 나중으로 미룰 수 없다: 작성 화면의 썸네일 스트립이 `<Image source={{uri}}>`인데
 * mp4는 렌더되지 않아 빈 칸이 된다.
 *
 * 길이 초과는 여기서 throw한다 — 두 작성 화면이 이미 pickPhotos를 try/catch로 감싸
 * alertDialog를 띄우므로 배선을 새로 깔 필요가 없다 (트리밍 UI는 범위 밖).
 */
async function pickedVideo(asset: ImagePicker.ImagePickerAsset): Promise<PickedPhoto> {
  const poster = await videoPoster(asset.uri);
  const durationMs = Math.round(asset.duration ?? poster.durationMs);
  if (durationMs > VIDEO_MAX_MS) {
    throw new Error(`영상은 ${VIDEO_MAX_MS / 1000}초까지 올릴 수 있어요`);
  }
  return {
    uri: asset.uri,
    width: poster.width,
    height: poster.height,
    takenAt: parseExifDate(asset.exif),
    video: { posterUri: poster.uri, durationMs },
  };
}

/** 영상 첫 프레임 → JPEG. 이후로는 평범한 사진 uri라 렌디션·크롭이 그대로 통한다 */
async function videoPoster(uri: string): Promise<{
  uri: string;
  width: number;
  height: number;
  durationMs: number;
}> {
  if (Platform.OS === 'web') return webVideoPoster(uri);
  const player = createVideoPlayer(uri);
  try {
    const [thumb] = await player.generateThumbnailsAsync(0);
    const ctx = ImageManipulator.ImageManipulator.manipulate(thumb);
    const rendered = await ctx.renderAsync();
    const out = await rendered.saveAsync({
      format: ImageManipulator.SaveFormat.JPEG,
      compress: 0.9,
    });
    return { uri: out.uri, width: out.width, height: out.height, durationMs: 0 };
  } finally {
    // 썸네일 비트맵을 쥔 네이티브 객체라 GC를 기다리지 않고 바로 놓아준다
    player.release();
  }
}

/** 웹에는 generateThumbnailsAsync가 없다 — <video>의 첫 프레임을 canvas로 옮긴다 */
async function webVideoPoster(uri: string) {
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.src = uri;
  await new Promise<void>((resolve, reject) => {
    // loadeddata = currentTime 0의 프레임이 준비된 시점
    video.onloadeddata = () => resolve();
    video.onerror = () => reject(new Error('영상을 읽지 못했어요'));
  });

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('영상을 읽지 못했어요');
  ctx.drawImage(video, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.9),
  );
  if (!blob) throw new Error('영상을 읽지 못했어요');
  return {
    uri: URL.createObjectURL(blob),
    width: canvas.width,
    height: canvas.height,
    durationMs: Math.round((video.duration || 0) * 1000),
  };
}

/**
 * 업로드 전 기기에서 720p로 줄인다 — 아이폰 4K 15초는 100MB가 넘어 그대로는 못 올린다.
 * 웹은 압축 수단이 없어 원본이 그대로 가고, 대신 업로드에서 크기 상한만 검사한다.
 */
async function compressVideo(
  uri: string,
  onProgress?: (ratio: number) => void,
  abort?: { current: boolean },
): Promise<string> {
  if (Platform.OS === 'web') return uri;
  const { Video } = await import('react-native-compressor');
  let cancellationId: string | null = null;
  return Video.compress(
    uri,
    {
      compressionMethod: 'manual',
      maxSize: 1280,
      bitrate: 2_500_000,
      getCancellationId: (id) => {
        cancellationId = id;
      },
    },
    (ratio) => {
      // 압축은 몇 초씩 걸린다 — 취소를 여기서 받지 않으면 그 시간을 통째로 기다려야 한다
      if (abort?.current && cancellationId) Video.cancelCompression(cancellationId);
      onProgress?.(ratio);
    },
  );
}

export interface UploadProgress {
  /** 지금 처리 중인 항목 (0부터) */
  index: number;
  total: number;
  phase: 'compress' | 'upload';
  /** 0~1 */
  ratio: number;
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
  // 영상은 화면에서 cover로 놓는다 — 자를 수 있는 건 포스터뿐이다.
  // 포스터를 프레임에 맞춰 잘라 두면 저장된 width/height가 프레임 비율이 되고,
  // 그림이 필요한 모든 곳(피드·격자·앨범)이 실제 재생 구도와 같은 그림을 본다.
  if (photo.video) {
    const poster = await cropToCanvas(
      { uri: photo.video.posterUri, width: photo.width, height: photo.height, takenAt: null },
      crop,
    );
    return {
      ...photo,
      width: poster.width,
      height: poster.height,
      video: { ...photo.video, posterUri: poster.uri },
    };
  }

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
  options?: {
    /** 표지 전용 — 앨범 커버로 쓰려고 구해 온 이미지. 그날의 사진이 아니라 아카이브에서 감춘다 */
    coverOnly?: boolean;
    onProgress?: (p: UploadProgress) => void;
    /**
     * 취소 깃발 — 항목 경계와 압축 중에 확인한다.
     * storage의 upload는 AbortSignal을 받지 않으므로 **"올리던 파일 하나는 마치고 멈춘다"**가
     * 정직한 동작이다. 멈추면 그 항목이 올린 파일은 지운다.
     */
    abort?: { current: boolean };
  },
): Promise<string[]> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error('로그인이 필요해요');
  const parentId = parent.trackId ?? parent.postId ?? parent.storyId!;

  const ids: string[] = [];
  for (const [index, photo] of photos.entries()) {
    if (options?.abort?.current) throw new Error('취소했어요');
    const video = photo.video;
    /**
     * 항목 하나 안에서의 진행을 0~1로 접어 내보낸다 — 영상은 압축이 앞 절반, 업로드가 뒤 절반.
     * 이렇게 접어야 막대가 단계 전환에서 뒤로 물러나지 않는다.
     */
    const progress = (phase: UploadProgress['phase'], ratio: number) =>
      options?.onProgress?.({
        index,
        total: photos.length,
        phase,
        ratio: video ? (phase === 'compress' ? ratio / 2 : 0.5 + ratio / 2) : ratio,
      });
    const path = `${coupleId}/${parentId}/${Crypto.randomUUID()}${video ? '.mp4' : '.jpg'}`;

    // 그림은 사진이면 원본에서, 영상이면 포스터에서 굽는다 — 두 갈래가 같은 렌디션 함수를 쓴다
    const source: PickedPhoto = video
      ? { uri: video.posterUri, width: photo.width, height: photo.height, takenAt: photo.takenAt }
      : photo;
    const main = await renderRendition(source, 'feed');
    const small = await renderRendition(source, 'grid');

    // 이 항목이 올린 파일 — 중간에 실패하면 되돌린다.
    // 이전 항목의 파일은 지우지 않는다: 그쪽은 이미 DB 행이 커밋돼 화면에 보이고 있다.
    const uploaded: string[] = [];
    // 스토리지에 실제로 올라간 크기 — 쿼터가 이 합계를 센다
    // (사진이면 1080+360, 영상이면 mp4+포스터+360)
    let bytes = 0;

    try {
      // 사진은 본체가 곧 feed 렌디션이라 파일이 2개, 영상은 mp4가 따로 있어 3개다
      const parts = video
        ? [
            {
              path,
              uri: await compressVideo(
                photo.uri,
                (ratio) => progress('compress', ratio),
                options?.abort,
              ),
              type: 'video/mp4',
            },
            { path: renditionPath(path, 'feed'), uri: main.uri, type: 'image/jpeg' },
            { path: renditionPath(path, 'grid'), uri: small.uri, type: 'image/jpeg' },
          ]
        : [
            { path, uri: main.uri, type: 'image/jpeg' },
            { path: renditionPath(path, 'grid'), uri: small.uri, type: 'image/jpeg' },
          ];

      for (const [i, part] of parts.entries()) {
        progress('upload', i / parts.length);
        const body = await (await fetch(part.uri)).arrayBuffer();
        // 웹은 압축 수단이 없어 원본이 그대로 온다 — 버킷 상한(50MB)에 닿아
        // 알아보기 어려운 스토리지 에러가 나기 전에 먼저 막는다
        if (part.type === 'video/mp4' && body.byteLength > WEB_VIDEO_MAX_BYTES) {
          throw new Error(`영상이 너무 커요 (${WEB_VIDEO_MAX_BYTES / 1024 / 1024}MB 이하)`);
        }
        const { error: upError } = await supabase.storage
          .from('photos')
          .upload(part.path, body, { contentType: part.type, cacheControl: PHOTO_CACHE_SEC });
        if (upError) throw upError;
        uploaded.push(part.path);
        bytes += body.byteLength;
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
          cover_only: options?.coverOnly ?? false,
          width: main.width,
          height: main.height,
          taken_at: photo.takenAt,
          bytes,
          media: video ? 'video' : 'photo',
          duration_ms: video?.durationMs ?? null,
        })
        .select('id')
        .single();
      if (rowError) throw rowError;
      ids.push(row.id);
    } catch (e) {
      // 업로드가 insert보다 먼저라, 쿼터 트리거가 거부하면 파일만 스토리지에 영구히 남는다.
      // 순서를 뒤집지 않는 이유: insert가 먼저면 업로드 실패 시 "깨진 사진 행"이 남아
      // 화면에 빈 칸으로 드러난다 — 고아 파일보다 나쁘다.
      if (uploaded.length) await supabase.storage.from('photos').remove(uploaded);
      // 압축을 끊으면 라이브러리 쪽 에러가 올라온다 — 사용자에게는 취소로 보여야 한다
      throw options?.abort?.current ? new Error('취소했어요') : e;
    }
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
      qc.invalidateQueries({ queryKey: ['storageQuota'] });
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
      qc.invalidateQueries({ queryKey: ['storageQuota'] });
    },
  });
}

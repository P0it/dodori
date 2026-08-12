/**
 * 미디어 경로 규칙과 용량 계산 — 순수 함수만.
 *
 * 사진과 동영상이 같은 `photos` 테이블·같은 버킷을 쓴다. 구분은 **본체 확장자** 하나다:
 * 사진은 `.jpg`, 영상은 `.mp4`. 영상의 렌디션은 첫 프레임을 구운 포스터 JPEG라,
 * `renditionPath()`가 mp4를 포스터로 매핑해 주면 **그림이 필요한 모든 화면은 영상을
 * 그냥 사진으로 본다** — 앨범 커버·캘린더·플레이리스트·장소 화면이 손댈 것 없이 동작한다.
 */

/** 렌디션 종류 — 본체(피드·뷰어)와 목록(격자·커버) */
export type RenditionKind = 'feed' | 'grid';

/** 동영상 길이 상한 — 15초 (용량 = 길이 × 화질이라 쿼터 설계의 핵심 상수다) */
export const VIDEO_MAX_MS = 15_000;

/**
 * 웹에서 올릴 수 있는 영상 원본의 상한.
 * 기기 압축(react-native-compressor)이 네이티브 전용이라 웹은 원본이 그대로 올라간다.
 */
export const WEB_VIDEO_MAX_BYTES = 45 * 1024 * 1024;

/** 720p 2.5Mbps 기준 예상 용량 — 실제 파일 크기를 모를 때 경고 문구에 쓴다 */
const VIDEO_BITRATE_BPS = 2_500_000;

export function isVideoPath(storagePath: string): boolean {
  return storagePath.endsWith('.mp4');
}

/**
 * 렌디션의 저장 경로.
 *
 * 사진: 본체 `{uuid}.jpg`가 곧 feed(1080), grid는 `{uuid}_360.jpg`
 * 영상: 본체는 `{uuid}.mp4`이고 **그림은 둘 다 포스터**  — feed는 `{uuid}_poster.jpg`(1080),
 *       grid는 `{uuid}_360.jpg`. 본체(mp4)는 여기가 아니라 재생용 서명에서 따로 다룬다.
 */
export function renditionPath(storagePath: string, kind: RenditionKind): string {
  if (isVideoPath(storagePath)) {
    return storagePath.replace(/\.mp4$/, kind === 'feed' ? '_poster.jpg' : '_360.jpg');
  }
  return kind === 'feed' ? storagePath : storagePath.replace(/\.jpg$/, '_360.jpg');
}

/** 경로 계산에 필요한 최소 모양 */
export interface MediaRef {
  storagePath: string;
  renditions: boolean;
}

/**
 * 이 미디어가 스토리지에 실제로 차지하는 경로 전부.
 * 삭제할 때 이걸 안 쓰면 렌디션이 고아 파일로 남는다 — 영상은 파일이 3개라 더 아프다.
 *
 * `renditions=false`는 렌디션 도입 전에 올라간 옛 사진이라 본체 하나뿐이다.
 */
export function storagePathsFor(media: MediaRef): string[] {
  if (isVideoPath(media.storagePath)) {
    return [
      media.storagePath,
      renditionPath(media.storagePath, 'feed'),
      renditionPath(media.storagePath, 'grid'),
    ];
  }
  return media.renditions
    ? [media.storagePath, renditionPath(media.storagePath, 'grid')]
    : [media.storagePath];
}

/**
 * 보관 용량 표기 — "62MB / 200MB" 처럼 쓴다.
 *
 * 1MB 미만은 KB로, 그 위는 MB로만 보여준다. GB 단위는 무료 한도(200MB)에서 나올 일이 없고,
 * 단위가 섞이면 남은 양을 눈으로 비교하기 어려워진다.
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0KB';
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.max(1, Math.round(kb))}KB`;
  const mb = kb / 1024;
  return `${mb < 10 ? Math.round(mb * 10) / 10 : Math.round(mb)}MB`;
}

/** 길이로 어림한 영상 용량 — 압축 전이라 실제 파일 크기를 모를 때만 */
export function estimateVideoBytes(durationMs: number): number {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return 0;
  return Math.round((durationMs / 1000) * (VIDEO_BITRATE_BPS / 8));
}

/**
 * 여러 항목을 올리는 동안의 전체 진행률 0~1.
 * 항목 안의 비율(`ratio`)은 부르는 쪽이 이미 0~1로 접어서 준다.
 */
export function uploadRatio(
  p: { index: number; total: number; ratio: number } | null | undefined,
): number {
  if (!p || p.total <= 0) return 0;
  const within = Math.min(1, Math.max(0, p.ratio));
  return Math.min(1, Math.max(0, (p.index + within) / p.total));
}

/** 용량 경고에 필요한 최소 모양 — 고른 항목(PickedPhoto)이 그대로 만족한다 */
export interface MediaEstimate {
  bytes?: number;
  video?: { durationMs: number };
}

export interface UploadEstimate {
  videoCount: number;
  bytes: number;
  /** 남은 공간 대비 몇 %를 쓰는가 — 남은 공간이 0이면 100 */
  percentOfRemaining: number;
}

/**
 * "영상 2개 · 약 9MB · 남은 공간의 6%" 를 만들기 위한 계산.
 *
 * 사진은 렌디션 합쳐 185KB 남짓이라 경고의 대상이 아니다 — 사람이 놀라는 쪽은 영상이고,
 * 게시물 10칸을 전부 영상으로 채우면 한 번에 50MB가 나간다.
 */
export function uploadEstimate(items: MediaEstimate[], remainingBytes: number): UploadEstimate {
  const videos = items.filter((it) => it.video);
  const bytes = videos.reduce(
    (sum, it) => sum + (it.bytes ?? estimateVideoBytes(it.video!.durationMs)),
    0,
  );
  const remaining = Math.max(0, remainingBytes);
  const percentOfRemaining =
    remaining <= 0 ? 100 : Math.min(100, Math.round((bytes / remaining) * 100));
  return { videoCount: videos.length, bytes, percentOfRemaining };
}

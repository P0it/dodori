/**
 * 트랙 커버 fallback 규칙 (PRD §6.4):
 * 지정 커버 → 없으면 콜라주(사진 2장+) → 사진 1장 → 플레이스홀더
 */
export type CoverPlan =
  | { kind: 'photo'; path: string }
  | { kind: 'collage'; paths: [string, string, string?, string?] }
  | { kind: 'placeholder' };

export function resolveCover(
  coverPhotoPath: string | null,
  photoPaths: string[],
): CoverPlan {
  if (coverPhotoPath) return { kind: 'photo', path: coverPhotoPath };
  if (photoPaths.length >= 2) {
    return { kind: 'collage', paths: photoPaths.slice(0, 4) as CoverPlan extends never ? never : [string, string, string?, string?] };
  }
  if (photoPaths.length === 1) return { kind: 'photo', path: photoPaths[0] };
  return { kind: 'placeholder' };
}

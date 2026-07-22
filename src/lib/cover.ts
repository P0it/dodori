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

/**
 * 생성 자켓 색 배정 — seed(트랙 id)를 buckets개 팔레트 중 하나로 결정적 매핑.
 * 같은 앨범은 언제 그려도 같은 자켓이어야 하므로 난수를 쓰지 않는다 (FNV-1a 해시).
 */
export function coverSeedIndex(seed: string, buckets: number): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return Math.abs(h) % buckets;
}

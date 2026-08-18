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

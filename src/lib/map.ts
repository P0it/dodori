// 코스 동선 지도용 순수 로직 — 좌표 필터/정렬과 카메라 범위 계산.
// lib/ 규칙: React·Supabase·RN import 금지. 유일한 단위 테스트 대상.

/** 좌표를 가질 수 있는 최소 장소 형태 */
export interface Coordinate {
  lat: number | null;
  lng: number | null;
}

/** 좌표를 가질 수 있고 코스 순서가 있는 장소 (TrackPlace의 부분집합) */
export interface Pinnable extends Coordinate {
  sortOrder: number;
}

/** 지도에 찍을 수 있게 좌표가 확정된 장소 */
export type Pinned<T extends Coordinate> = T & { lat: number; lng: number };

export interface LatLng {
  lat: number;
  lng: number;
}

/** 네이버 지도 Region — SW 지점(latitude/longitude) + NE까지의 위·경도 차이(delta) */
export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// 한 점이거나 아주 가까운 핀들이라도 지도가 과하게 확대되지 않도록 하는 최소 범위.
// 위도 0.012° ≈ 1.3km — 패딩까지 먹으면 화면 가로가 약 2km가 된다.
// 장소가 하나뿐일 때 건물만 꽉 차 보이던 것을 고치려고 500m에서 올렸다(2026-08-05):
// 핀 하나만 봐도 그게 어느 동네인지는 보여야 한다.
const MIN_SPAN = 0.012;
// 핀이 화면 가장자리에 붙지 않게 범위를 넉넉히 감싸는 배율.
const PADDING = 1.5;

/** 좌표(lat·lng 둘 다 유효)가 있는 장소만. 순서는 넘어온 그대로 — 찜 목록처럼 코스 순서가 없는 쪽이 쓴다 */
export function withCoords<T extends Coordinate>(places: T[]): Pinned<T>[] {
  return places.filter((p): p is Pinned<T> => Number.isFinite(p.lat) && Number.isFinite(p.lng));
}

/** 좌표(lat·lng 둘 다 유효)가 있는 장소만, sortOrder 오름차순으로 */
export function pinnablePlaces<T extends Pinnable>(places: T[]): Pinned<T>[] {
  return withCoords(places).sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * 네이버 지도 검색 URL.
 * places.link는 네이버가 준 **업체 홈페이지**라 인스타·블로그로 튄다 — 지도 링크로 쓸 수 없다.
 * 이름으로 검색하고, 좌표가 있으면 지도를 그 지점으로 옮긴다(같은 이름의 다른 지점과 섞이지 않게).
 */
export function naverMapUrl(place: { name: string; lat: number | null; lng: number | null }): string {
  const base = `https://map.naver.com/p/search/${encodeURIComponent(place.name.trim())}`;
  const { lat, lng } = place;
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return base;
  return `${base}?c=${lng},${lat},16,0,0,0,dh`;
}

/** 핀들을 모두 담는 카메라 범위. 빈 배열이면 null */
export function boundsOf(points: LatLng[]): MapRegion | null {
  if (points.length === 0) return null;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const { lat, lng } of points) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  const latDelta = Math.max(maxLat - minLat, MIN_SPAN) * PADDING;
  const lngDelta = Math.max(maxLng - minLng, MIN_SPAN) * PADDING;
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  return {
    latitude: centerLat - latDelta / 2,
    longitude: centerLng - lngDelta / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

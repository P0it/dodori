// 리스트 아이콘의 기하 정보 — 순수 데이터. lib/ 규칙대로 React·RN import 없음.
// 여기 있는 이유: 같은 아이콘을 세 곳이 그린다 — 타일(react-native-svg),
// 네이티브 지도 핀(react-native-svg), 웹 지도 핀(문자열 SVG). 정의가 갈리면 셋이 어긋난다.

/** 리스트에서 고를 수 있는 라인 아이콘 키 (Lucide 계열, stroke) */
export const PLAYLIST_ICON_KEYS = [
  'pin',
  'coffee',
  'utensils',
  'wine',
  'heart',
  'star',
  'bag',
  'camera',
  'music',
] as const;
export type PlaylistIconKey = (typeof PLAYLIST_ICON_KEYS)[number];

/** 24×24 viewBox 기준 도형 하나 */
export type IconShape =
  | { kind: 'path'; d: string }
  | { kind: 'circle'; cx: number; cy: number; r: number };

const path = (d: string): IconShape => ({ kind: 'path', d });
const circle = (cx: number, cy: number, r: number): IconShape => ({ kind: 'circle', cx, cy, r });

const SHAPES: Record<PlaylistIconKey, IconShape[]> = {
  pin: [path('M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z'), circle(12, 10, 3)],
  coffee: [
    path('M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1'),
    path('M6 2v2'),
    path('M10 2v2'),
    path('M14 2v2'),
  ],
  utensils: [
    // 머리 U자는 x 3~11(중심 7) — 손잡이(x=7)와 중심을 맞춘다. 어긋나면 큰 타일에서 찌그러져 보인다
    path('M3 2v7c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V2'),
    path('M7 2v20'),
    path('M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7'),
  ],
  wine: [
    path('M8 22h8'),
    path('M7 10h10'),
    path('M12 15v7'),
    path('M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z'),
  ],
  heart: [path('M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.5 4.04 3 5.5l7 7Z')],
  star: [path('m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z')],
  bag: [path('M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z'), path('M3 6h18'), path('M16 10a4 4 0 0 1-8 0')],
  camera: [
    path('M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z'),
    circle(12, 13, 3),
  ],
  music: [path('M9 18V5l12-2v13'), circle(6, 18, 3), circle(18, 16, 3)],
};

/** 아이콘 이름 → 도형들. 모르는 이름·null이면 pin (리스트 아이콘은 사용자가 고른 값이라 방어한다) */
export function playlistIconShapes(name: string | null | undefined): IconShape[] {
  return SHAPES[name as PlaylistIconKey] ?? SHAPES.pin;
}

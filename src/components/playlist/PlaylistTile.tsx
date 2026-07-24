import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { typeface, color as tokens, eventColor, toEventColor } from '@/theme/tokens';

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

/** 라인 아이콘 한 개 — 윤곽선 색(color)을 받아 그린다. 배경 없음. */
export function PlaylistIcon({ name, color, size }: { name: string; color: string; size: number }) {
  const p = (d: string, key: string) => (
    <Path key={key} d={d} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  );
  const circle = (cx: number, cy: number, r: number, key: string) => (
    <Circle key={key} cx={cx} cy={cy} r={r} stroke={color} strokeWidth={2} fill="none" />
  );
  let glyph: ReactNode;
  switch (name) {
    case 'coffee':
      glyph = [
        p('M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1', 'c'),
        p('M6 2v2', 'a'),
        p('M10 2v2', 'b'),
        p('M14 2v2', 'd'),
      ];
      break;
    case 'utensils':
      glyph = [
        p('M3 2v7c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2V2', 'a'),
        p('M7 2v20', 'b'),
        p('M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7', 'c'),
      ];
      break;
    case 'wine':
      glyph = [
        p('M8 22h8', 'a'),
        p('M7 10h10', 'b'),
        p('M12 15v7', 'c'),
        p('M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z', 'd'),
      ];
      break;
    case 'heart':
      glyph = p('M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.5 4.04 3 5.5l7 7Z', 'a');
      break;
    case 'star':
      glyph = p('m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', 'a');
      break;
    case 'bag':
      glyph = [p('M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z', 'a'), p('M3 6h18', 'b'), p('M16 10a4 4 0 0 1-8 0', 'c')];
      break;
    case 'camera':
      glyph = [
        p('M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z', 'a'),
        circle(12, 13, 3, 'b'),
      ];
      break;
    case 'music':
      glyph = [p('M9 18V5l12-2v13', 'a'), circle(6, 18, 3, 'b'), circle(18, 16, 3, 'c')];
      break;
    case 'pin':
    default:
      glyph = [p('M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z', 'a'), circle(12, 10, 3, 'b')];
      break;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {glyph}
    </Svg>
  );
}

/** 리스트 표현 타일 — 중립 배경 + 고른 색의 라인 아이콘(없으면 이름 첫 글자). props-only. */
export function PlaylistTile({
  colorKey,
  icon,
  name,
  size,
  radius = 8,
}: {
  colorKey: string | null;
  icon: string | null;
  name: string;
  size: number;
  radius?: number;
}) {
  const stroke = eventColor[toEventColor(colorKey)].fg;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: tokens.surface2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon ? (
        <PlaylistIcon name={icon} color={stroke} size={size * 0.5} />
      ) : (
        <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: size * 0.4, color: stroke }}>
          {name.slice(0, 1)}
        </Text>
      )}
    </View>
  );
}

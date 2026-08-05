import { Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { typeface, color as tokens, eventColor, toEventColor } from '@/theme/tokens';
import { playlistIconShapes } from '@/lib/playlistIcons';

export { PLAYLIST_ICON_KEYS, type PlaylistIconKey } from '@/lib/playlistIcons';

/** 라인 아이콘 한 개 — 윤곽선 색(color)을 받아 그린다. 배경 없음. */
export function PlaylistIcon({ name, color, size }: { name: string; color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {playlistIconShapes(name).map((s, i) =>
        s.kind === 'path' ? (
          <Path
            key={i}
            d={s.d}
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ) : (
          <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} stroke={color} strokeWidth={2} fill="none" />
        ),
      )}
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

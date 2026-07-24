import { Text, View, type ViewStyle, type StyleProp } from 'react-native';
import { Image } from 'expo-image';
import { color, typeface } from '@/theme/tokens';
import { resolveCover } from '@/lib/cover';

type Props = {
  /** 서명 썸네일 URL — 비공개 버킷이라 경로가 아니라 완성된 URL을 받는다 (api/에서 서명) */
  coverThumbUrl: string | null;
  photoThumbUrls: string[];
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/** 트랙 커버 — §6.4 fallback: 지정 커버 → 콜라주(2+) → 1장 → 플레이스홀더 */
export function TrackCover({ coverThumbUrl, photoThumbUrls, size = 168, style }: Props) {
  const plan = resolveCover(coverThumbUrl, photoThumbUrls);
  const rad = size > 90 ? 6 : 5;

  if (plan.kind === 'photo') {
    return (
      <View style={[{ width: size, height: size, borderRadius: rad, overflow: 'hidden' }, style]}>
        <Image
          source={plan.path}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
      </View>
    );
  }
  if (plan.kind === 'collage') {
    const cells = [plan.paths[0], plan.paths[1], plan.paths[2], plan.paths[3]];
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: rad,
            overflow: 'hidden',
            flexDirection: 'row',
            flexWrap: 'wrap',
          },
          style,
        ]}
      >
        {cells.map((p, i) =>
          p ? (
            <Image
              key={i}
              source={p}
              style={{ width: '50%', height: '50%' }}
              contentFit="cover"
            />
          ) : (
            <View key={i} style={{ width: '50%', height: '50%', backgroundColor: color.surface2 }} />
          ),
        )}
      </View>
    );
  }
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: rad,
          backgroundColor: color.surface2,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        },
        style,
      ]}
    >
      <Text style={{ fontFamily: typeface, fontSize: size * 0.16, color: color.muted }}>♪</Text>
      <Text style={{ fontFamily: typeface, fontSize: 12, color: color.muted }}>커버 없음</Text>
    </View>
  );
}

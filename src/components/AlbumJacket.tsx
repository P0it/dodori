import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { color, coverPalette, typeface } from '@/theme/tokens';
import { coverSeedIndex } from '@/lib/cover';

type Props = {
  /** 결정적 색 배정용 — 트랙 id */
  seed: string;
  /** 자켓에 크게 박히는 날짜 'MM.DD' */
  dateLabel: string;
  title: string;
  size: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * 사진 없는 앨범의 생성 자켓 — 사진이 생기면 TrackCover가 실제 사진으로 대체한다.
 * 색은 seed로 고정(같은 앨범 = 같은 자켓), 도돌이표 마크로 브랜드를 얹는다.
 */
export function AlbumJacket({ seed, dateLabel, title, size, style }: Props) {
  const [light, dark] = coverPalette[coverSeedIndex(seed, coverPalette.length)];
  const pad = Math.round(size * 0.08);

  return (
    <LinearGradient
      colors={[light, dark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ width: size, height: size, borderRadius: 6, overflow: 'hidden', padding: pad }, style]}
    >
      {/* 큰 날짜 — 자켓의 주인공 */}
      <Text
        style={{
          fontFamily: typeface,
          fontWeight: '800',
          fontSize: size * 0.19,
          letterSpacing: -0.5,
          color: color.white,
        }}
      >
        {dateLabel}
      </Text>
      <Text
        numberOfLines={2}
        style={{
          marginTop: 2,
          fontFamily: typeface,
          fontWeight: '600',
          fontSize: size * 0.085,
          color: 'rgba(255,255,255,0.82)',
        }}
      >
        {title}
      </Text>

      {/* 도돌이표 마크 — 우하단 */}
      <View style={{ position: 'absolute', right: pad, bottom: pad }}>
        <Text
          style={{
            fontFamily: typeface,
            fontWeight: '700',
            fontSize: size * 0.16,
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          𝄆
        </Text>
      </View>
    </LinearGradient>
  );
}

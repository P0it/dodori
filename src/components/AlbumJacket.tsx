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

/** LP가 슬리브 밖으로 반쯤 빠져나온 모양 — 홈·라벨·그루브 */
function Disc({ size, label }: { size: number; label: string }) {
  const grooves = [0.88, 0.74, 0.6];
  return (
    <View
      style={{
        position: 'absolute',
        right: -size * 0.34,
        top: '50%',
        marginTop: -size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#0E0E0E',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {grooves.map((r) => (
        <View
          key={r}
          style={{
            position: 'absolute',
            width: size * r,
            height: size * r,
            borderRadius: (size * r) / 2,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.07)',
          }}
        />
      ))}
      {/* 라벨 + 가운데 홈 */}
      <View
        style={{
          width: size * 0.36,
          height: size * 0.36,
          borderRadius: size * 0.18,
          backgroundColor: label,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: size * 0.07,
            height: size * 0.07,
            borderRadius: size * 0.035,
            backgroundColor: '#0E0E0E',
          }}
        />
      </View>
    </View>
  );
}

/**
 * 사진 없는 앨범의 생성 자켓 — 사진이 생기면 TrackCover가 실제 사진으로 대체한다.
 * 색은 seed로 고정(같은 앨범 = 같은 자켓). 어두운 슬리브 + LP 실루엣으로 앨범 느낌을 낸다.
 */
export function AlbumJacket({ seed, dateLabel, title, size, style }: Props) {
  const [light, dark] = coverPalette[coverSeedIndex(seed, coverPalette.length)];
  const pad = Math.round(size * 0.08);

  return (
    <LinearGradient
      colors={[dark, '#0D0D0D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ width: size, height: size, borderRadius: 6, overflow: 'hidden', padding: pad }, style]}
    >
      <Disc size={size * 0.82} label={light} />

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
    </LinearGradient>
  );
}

import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COVER_HUE_STEPS, color, coverTones, typeface } from '@/theme/tokens';
import { coverSeedIndex } from '@/lib/cover';
import { weekdayKo } from '@/lib/date';

type Props = {
  /** 결정적 색 배정용 — 트랙 id */
  seed: string;
  /** 'YYYY-MM-DD' — 자켓엔 'MM.DD (요일)'로 작게 들어간다 */
  date: string;
  title: string;
  size: number;
  style?: StyleProp<ViewStyle>;
};

/** LP가 슬리브 밖으로 반쯤 빠져나온 모양 — 홈·라벨·그루브 */
function Disc({ size, label, vinyl }: { size: number; label: string; vinyl: string }) {
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
        backgroundColor: vinyl,
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
            backgroundColor: vinyl,
          }}
        />
      </View>
    </View>
  );
}

/**
 * 사진 없는 앨범의 생성 자켓 — 사진이 생기면 TrackCover가 실제 사진으로 대체한다.
 * 앨범명이 주인공, 날짜·요일은 그 아래 작게. 색은 seed로 고정(같은 앨범 = 같은 자켓).
 */
export function AlbumJacket({ seed, date, title, size, style }: Props) {
  const tone = coverTones(coverSeedIndex(seed, COVER_HUE_STEPS));
  const pad = Math.round(size * 0.08);

  return (
    <LinearGradient
      colors={[tone.sleeveTop, tone.sleeveBottom]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ width: size, height: size, borderRadius: 6, overflow: 'hidden', padding: pad }, style]}
    >
      <Disc size={size * 0.82} label={tone.label} vinyl={tone.vinyl} />

      <Text
        numberOfLines={2}
        style={{
          fontFamily: typeface,
          fontWeight: '800',
          fontSize: size * 0.145,
          lineHeight: size * 0.175,
          letterSpacing: -0.4,
          color: color.white,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          marginTop: 4,
          fontFamily: typeface,
          fontWeight: '600',
          fontSize: size * 0.072,
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        {date.slice(5).replace('-', '.')} ({weekdayKo(date)})
      </Text>
    </LinearGradient>
  );
}

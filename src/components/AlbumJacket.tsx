import { type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COVER_HUE_STEPS, coverTones } from '@/theme/tokens';
import { coverSeedIndex } from '@/lib/cover';

type Props = {
  /** 결정적 색 배정용 — 트랙 id */
  seed: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * 사진 없는 앨범의 생성 자켓 — 색 그라디언트 한 면. 부모를 꽉 채운다.
 * 제목·날짜는 자켓 위에 얹는 쪽(캐러셀 카드·상세 히어로)이 그린다.
 * 색은 seed로 고정(같은 앨범 = 같은 자켓).
 */
export function AlbumJacket({ seed, style }: Props) {
  const tone = coverTones(coverSeedIndex(seed, COVER_HUE_STEPS));

  return (
    <LinearGradient
      colors={[tone.from, tone.mid, tone.to]}
      locations={[0, 0.52, 1]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[{ width: '100%', height: '100%' }, style]}
    >
      {/* 반대 대각으로 한 겹 더 — 단조로운 사선 대신 오른쪽 위에서 빛이 든 면이 된다 */}
      <LinearGradient
        colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.15, y: 0.85 }}
        style={{ width: '100%', height: '100%' }}
      />
    </LinearGradient>
  );
}

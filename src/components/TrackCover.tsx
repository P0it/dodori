import { Text, View, type ViewStyle, type StyleProp } from 'react-native';
import { Image } from 'expo-image';
import { color, typeface } from '@/theme/tokens';
import { resolveCover } from '@/lib/cover';
import { AlbumJacket } from '@/components/AlbumJacket';

type Props = {
  /** 서명 썸네일 URL — 비공개 버킷이라 경로가 아니라 완성된 URL을 받는다 (api/에서 서명) */
  coverThumbUrl: string | null;
  photoThumbUrls: string[];
  /** 주면 사진이 하나도 없을 때 그라디언트 자켓으로 채운다 (트랙 id). 없으면 '커버 없음' */
  seed?: string;
  size?: number;
  /** 정사각이 아닐 때 — 히어로처럼 폭·높이를 따로 줄 때만 */
  width?: number;
  height?: number;
  radius?: number;
  /** 검정 배경 위 부양감. 화면 폭을 채우는 히어로에선 끈다 */
  glow?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** 트랙 커버 — §6.4 fallback: 지정 커버 → 콜라주(2+) → 1장 → 자켓/플레이스홀더 */
export function TrackCover({
  coverThumbUrl,
  photoThumbUrls,
  seed,
  size = 168,
  width,
  height,
  radius,
  glow = true,
  style,
}: Props) {
  const plan = resolveCover(coverThumbUrl, photoThumbUrls);
  const rad = radius ?? (size > 90 ? 6 : 5);

  let inner;
  if (plan.kind === 'photo') {
    inner = (
      <Image source={plan.path} style={{ width: '100%', height: '100%' }} contentFit="cover" />
    );
  } else if (plan.kind === 'collage') {
    const cells = [plan.paths[0], plan.paths[1], plan.paths[2], plan.paths[3]];
    inner = (
      <View style={{ width: '100%', height: '100%', flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((p, i) =>
          p ? (
            <Image key={i} source={p} style={{ width: '50%', height: '50%' }} contentFit="cover" />
          ) : (
            <View key={i} style={{ width: '50%', height: '50%', backgroundColor: color.surface2 }} />
          ),
        )}
      </View>
    );
  } else if (seed) {
    inner = <AlbumJacket seed={seed} />;
  } else {
    inner = (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Text style={{ fontFamily: typeface, fontSize: size * 0.16, color: color.muted }}>♪</Text>
        <Text style={{ fontFamily: typeface, fontSize: 12, color: color.muted }}>커버 없음</Text>
      </View>
    );
  }

  // 글로우 레이어(clip 없음) + 안쪽 clip 레이어.
  // 검정 배경 위에선 검은 그림자가 안 보인다 — 부양감은 연한 빛(글로우)으로 준다.
  return (
    <View
      style={[
        {
          width: width ?? size,
          height: height ?? size,
          borderRadius: rad,
          backgroundColor: color.surface2,
          boxShadow: glow ? '0px 10px 34px 4px rgba(255,255,255,0.20)' : undefined,
        },
        style,
      ]}
    >
      <View style={{ width: '100%', height: '100%', borderRadius: rad, overflow: 'hidden' }}>
        {inner}
      </View>
    </View>
  );
}

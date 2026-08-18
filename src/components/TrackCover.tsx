import { Text, View, type ViewStyle, type StyleProp } from 'react-native';
import { color, typeface } from '@/theme/tokens';
import { AlbumJacket } from '@/components/AlbumJacket';
import { Photo } from '@/components/Photo';

type Props = {
  /** 서명 썸네일 URL — 비공개 버킷이라 경로가 아니라 완성된 URL을 받는다 (api/에서 서명) */
  coverThumbUrl: string | null;
  /** 주면 커버가 없을 때 그라디언트 자켓으로 채운다 (트랙 id). 없으면 '커버 없음' */
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

/**
 * 트랙 커버 — 지정한 커버 한 장, 없으면 자켓.
 *
 * 여러 장을 콜라주로 붙이던 폴백은 걷어냈다: 사진을 올릴수록 히어로가 조각보가 돼서
 * "배경에 사진 한 장"이라는 의도와 어긋났다. 커버는 고르는 것이고, 고르기 전엔 자켓이다.
 */
export function TrackCover({
  coverThumbUrl,
  seed,
  size = 168,
  width,
  height,
  radius,
  glow = true,
  style,
}: Props) {
  const rad = radius ?? (size > 90 ? 6 : 5);

  let inner;
  if (coverThumbUrl) {
    inner = <Photo url={coverThumbUrl} style={{ width: '100%', height: '100%' }} contentFit="cover" />;
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

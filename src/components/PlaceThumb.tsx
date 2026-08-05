import { Text } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { color, coverPalette, typeface } from '@/theme/tokens';
import { coverSeedIndex } from '@/lib/cover';
import { photoSource } from '@/lib/photoSource';

/**
 * 장소 썸네일 — 다녀온 곳은 그 데이트 사진, 안 가본 곳은 생성 자켓.
 * (네이버 지역검색은 장소 이미지를 제공하지 않는다.)
 */
export function PlaceThumb({
  placeId,
  name,
  thumbUrl,
  size,
}: {
  placeId: string;
  name: string;
  thumbUrl?: string | null;
  size: number;
}) {
  if (thumbUrl) {
    return (
      <Image
        source={photoSource(thumbUrl)}
        style={{ width: size, height: size, borderRadius: 8, backgroundColor: color.surface2 }}
        contentFit="cover"
      />
    );
  }
  const [light, dark] = coverPalette[coverSeedIndex(placeId, coverPalette.length)];
  return (
    <LinearGradient
      colors={[light, dark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: typeface,
          fontWeight: '800',
          fontSize: Math.round(size * 0.34),
          color: color.white,
        }}
      >
        {name.trim().slice(0, 1) || '?'}
      </Text>
    </LinearGradient>
  );
}

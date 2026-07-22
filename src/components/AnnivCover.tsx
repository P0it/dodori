import { Text, View, type ViewStyle, type StyleProp } from 'react-native';
import { Image } from 'expo-image';
import { color, typeface } from '@/theme/tokens';

type Props = {
  size?: number;
  /** 큰 텍스트 (예: "100") */
  big?: string;
  /** 작은 텍스트 (예: "일") */
  small?: string;
  /** 사진이 있으면 사진 커버로 렌더 */
  photo?: string;
  style?: StyleProp<ViewStyle>;
};

/** 기념일 커버 — 플랫 사각 + amber 텍스트, 사진 있으면 사진 (목업 AnnivCover) */
export function AnnivCover({ size = 56, big, small, photo, style }: Props) {
  const rad = size > 90 ? 8 : 6;
  if (photo) {
    return (
      <View style={[{ width: size, height: size, borderRadius: rad, overflow: 'hidden' }, style]}>
        <Image source={photo} style={{ width: '100%', height: '100%' }} contentFit="cover" />
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
          backgroundColor: '#2A2119',
          alignItems: 'center',
          justifyContent: 'center',
          gap: size * 0.02,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: typeface, fontWeight: '700',
          fontSize: size * 0.36,
          color: color.anniv,
          letterSpacing: -0.3,
          lineHeight: size * 0.4,
        }}
      >
        {big}
      </Text>
      {small ? (
        <Text
          style={{
            fontFamily: typeface, fontWeight: '600',
            fontSize: size * 0.15,
            color: 'rgba(232,184,75,0.7)',
            letterSpacing: 1,
          }}
        >
          {small}
        </Text>
      ) : null}
    </View>
  );
}

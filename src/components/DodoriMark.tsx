import { Text, View } from 'react-native';
import { color } from '@/theme/tokens';

type Props = { size?: number; showWord?: boolean };

/** 도돌이 마크 — 여는 도돌이표 𝄆 (막대 2 + 점 2, 브랜드 그린 단색). 앱 아이콘과 동일 지오메트리 */
export function DodoriMark({ size = 40, showWord = false }: Props) {
  const g = color.greenBright;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: size * 0.8, height: size }}>
        <View
          style={{
            position: 'absolute',
            left: 0,
            width: size * 0.22,
            height: size,
            borderRadius: size * 0.03,
            backgroundColor: g,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: size * 0.33,
            width: size * 0.085,
            height: size,
            borderRadius: size * 0.03,
            backgroundColor: g,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: size * 0.54,
            top: size * 0.17,
            width: size * 0.26,
            height: size * 0.26,
            borderRadius: size * 0.13,
            backgroundColor: g,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: size * 0.54,
            top: size * 0.57,
            width: size * 0.26,
            height: size * 0.26,
            borderRadius: size * 0.13,
            backgroundColor: g,
          }}
        />
      </View>
      {showWord && (
        <Text
          style={{
            fontWeight: '800',
            fontSize: size * 0.8,
            letterSpacing: -1,
            color: color.white,
          }}
        >
          도돌이
        </Text>
      )}
    </View>
  );
}

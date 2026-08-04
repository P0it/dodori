import { Text, View } from 'react-native';
import { color, typeface } from '@/theme/tokens';

type Props = {
  size?: number;
  showWord?: boolean;
  /** 아래 점을 비운다 — 스플래시에서 그 점만 따로 애니메이션하려고 (BrandSplash) */
  hideLowerDot?: boolean;
};

/** 마크 박스 기준 아래 점의 중심·지름 비율 — 떼어낸 점을 제자리에 겹치려면 이 값이 필요하다 */
export const MARK_LOWER_DOT = { cx: 0.67, cy: 0.7, d: 0.26 } as const;

/** 도도리 마크 — 여는 도돌이표 𝄆 (막대 2 + 점 2, 브랜드 그린 단색). 앱 아이콘과 동일 지오메트리 */
export function DodoriMark({ size = 40, showWord = false, hideLowerDot = false }: Props) {
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
        {!hideLowerDot && (
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
        )}
      </View>
      {showWord && (
        <Text
          style={{
            fontFamily: typeface, fontWeight: '800',
            fontSize: size * 0.8,
            letterSpacing: -0.5,
            color: color.white,
          }}
        >
          Dodori
        </Text>
      )}
    </View>
  );
}

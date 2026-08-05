import { Text, View } from 'react-native';
import { color, typeface } from '@/theme/tokens';

type Props = {
  size?: number;
  showWord?: boolean;
  /**
   * 락업 방향. `row`는 마크 옆에 글자를 두는 인라인 락업(헤더용),
   * `stack`은 마크 아래 글자를 두는 세로 락업(스플래시·로그인처럼 마크가 주인공인 화면).
   */
  layout?: 'row' | 'stack';
  /** 아래 점을 비운다 — 스플래시에서 그 점만 따로 애니메이션하려고 (BrandSplash) */
  hideLowerDot?: boolean;
};

/** 마크 박스 기준 아래 점의 중심·지름 비율 — 떼어낸 점을 제자리에 겹치려면 이 값이 필요하다 */
export const MARK_LOWER_DOT = { cx: 0.67, cy: 0.7, d: 0.26 } as const;

/**
 * 워드마크 비율 — **스플래시가 기준이다**(좌표를 실측해 맞춘 화면이라 여기 값이 가장 정확하다).
 * 세로 락업은 마크가 주인공이라 글자가 마크의 0.46, 가로 락업은 로고처럼 나란히 서므로 0.8.
 * 자간은 글자 크기에 비례한다 — 고정값(-0.5)을 쓰면 큰 화면에서만 헐거워 보인다.
 */
export const WORD = { stackRatio: 0.46, rowRatio: 0.8, tracking: -0.028, stackGap: 0.2 } as const;

/** 도도리 마크 — 여는 도돌이표 𝄆 (막대 2 + 점 2, 브랜드 그린 단색). 앱 아이콘과 동일 지오메트리 */
export function DodoriMark({
  size = 40,
  showWord = false,
  layout = 'row',
  hideLowerDot = false,
}: Props) {
  const g = color.greenBright;
  const stacked = layout === 'stack';
  const wordSize = size * (stacked ? WORD.stackRatio : WORD.rowRatio);
  return (
    <View
      style={{
        flexDirection: stacked ? 'column' : 'row',
        alignItems: 'center',
        gap: stacked ? size * WORD.stackGap : 12,
      }}
    >
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
            fontFamily: typeface,
            fontWeight: '800',
            fontSize: wordSize,
            letterSpacing: wordSize * WORD.tracking,
            color: color.white,
          }}
        >
          dodori
        </Text>
      )}
    </View>
  );
}

import { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { color, radius } from '@/theme/tokens';

/** 한 번 밝아졌다 어두워지는 데 걸리는 시간 — 초조해 보이지 않을 만큼 느리게 */
const PULSE_MS = 900;

/**
 * 로딩 자리를 채우는 회색 판.
 *
 * 데이터가 오기 전 화면을 비워 두면 "아무것도 없는 앱"으로 보였다가 갑자기 목록이 생긴다 —
 * 올 것이 있다는 표시를 먼저 깔아 둔다. 실제 셀과 **같은 크기·같은 모서리**로 그려야
 * 목록이 도착할 때 자리가 튀지 않는다.
 */
export function Skeleton({ style }: { style?: ViewStyle }) {
  const pulse = useSharedValue(0.45);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: PULSE_MS, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);

  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[
        { backgroundColor: color.surface2, borderRadius: radius.mini, overflow: 'hidden' },
        style,
        animated,
      ]}
    />
  );
}

/**
 * 정사각 그리드 스켈레톤 (피드 계정 그리드·스토리 보관함).
 * `numColumns`·`margin`은 실제 셀(PostGridCell)과 같은 값이어야 한다.
 */
export function SkeletonGrid({ count, columns = 3 }: { count: number; columns?: number }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={{ width: `${100 / columns}%`, padding: 1.5 }}>
          <Skeleton style={{ width: '100%', aspectRatio: 1 }} />
        </View>
      ))}
    </View>
  );
}

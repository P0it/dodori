import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { color, typeface } from '@/theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 66;
const STROKE = 5;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

/**
 * 남은 시간 링 — 제한시간 종목(두더지·연타·글자색)이 공유한다.
 * 숫자를 100ms마다 다시 그리면 뚝뚝 끊겨 보인다. 링은 마운트 시 한 번
 * withTiming을 걸어 60fps로 돌리고, 가운데 숫자만 호출부의 갱신 주기를 따른다.
 */
export function CountdownRing({
  durationMs,
  /** 가운데에 쓸 값 — 남은 초, 점수 등 호출부가 정한다 */
  label,
  caption,
  running = true,
}: {
  durationMs: number;
  label: string;
  caption?: string;
  running?: boolean;
}) {
  const progress = useSharedValue(1);

  useEffect(() => {
    if (!running) return;
    progress.value = 1;
    progress.value = withTiming(0, { duration: durationMs, easing: Easing.linear });
  }, [durationMs, running, progress]);

  const ring = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke={color.surface3}
          strokeWidth={STROKE}
          fill="none"
        />
        {/* -90도 회전으로 12시에서 시작 */}
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke={color.accent}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={ring}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>
      <Text
        style={{ fontFamily: typeface, fontWeight: '800', fontSize: 20, color: color.white }}
      >
        {label}
      </Text>
      {caption ? (
        <Text style={{ fontFamily: typeface, fontSize: 10, color: color.sub }}>{caption}</Text>
      ) : null}
    </View>
  );
}

import { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { color, space, typeface } from '@/theme/tokens';
import type { GameProps } from '../GameHost';

/**
 * 단계 n: 그리드 중 한 칸만 살짝 다른 명도. 맞히면 다음 단계, 틀리면 종료(점수 = 마지막으로 맞힌 단계).
 * 칸 색은 토큰이 아니라 계산된 hsl이다 — "단계마다 좁아지는 명도차"가 이 종목의 규칙 자체라
 * 고정 팔레트로는 표현할 수 없다.
 */
export default function OddColorGame({ onFinish }: GameProps) {
  const [level, setLevel] = useState(1);

  const cols = Math.min(2 + Math.floor(level / 2), 5);
  const count = cols * cols;
  // 명도차(작을수록 어려움). 가파르게 좁혀야 한 판이 10초대에서 끝난다 —
  // 완만하면 잘하는 사람이 20단계까지 가면서 판이 늘어진다.
  const diff = Math.max(4, 44 - level * 7);
  const base = 60;
  const baseColor = `hsl(210, 12%, ${base}%)`;
  const oddColor = `hsl(210, 12%, ${base - diff / 3}%)`;
  // 위치는 매 단계 무작위 — 고정 규칙이면 어디를 볼지 외워버린다
  const odd = useMemo(() => Math.floor(Math.random() * count), [count, level]);

  const grid = useSharedValue(1);
  const shake = useSharedValue(0);
  const ending = useRef(false);

  function pick(i: number) {
    if (ending.current) return; // 흔들리는 동안 또 누르면 점수가 두 번 제출된다
    if (i === odd) {
      // 다음 판이 새로 깔리는 느낌 — 칸이 바뀐 걸 못 보고 헤매지 않게
      grid.value = withSequence(withTiming(0.92, { duration: 70 }), withSpring(1, { damping: 11 }));
      setLevel((l) => l + 1);
      return;
    }
    // 종료 화면으로 바로 넘기면 컴포넌트가 사라져 흔들림이 보이지 않는다
    ending.current = true;
    shake.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 60 }),
      withTiming(0, { duration: 50 }),
    );
    setTimeout(() => onFinish(level - 1), 190);
  }

  const board = useAnimatedStyle(() => ({
    transform: [{ scale: grid.value }, { translateX: shake.value }],
  }));

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontFamily: typeface, fontWeight: '700', color: color.white }}>{level}단계</Text>
      <Animated.View
        style={[
          board,
          {
            flexDirection: 'row',
            flexWrap: 'wrap',
            width: cols * 56,
            marginTop: space[3],
            gap: 4,
            justifyContent: 'center',
          },
        ]}
      >
        {Array.from({ length: count }, (_, i) => (
          <Pressable
            key={i}
            onPressIn={() => pick(i)}
            style={{
              width: 52,
              height: 52,
              borderRadius: 8,
              backgroundColor: i === odd ? oddColor : baseColor,
            }}
          />
        ))}
      </Animated.View>
    </View>
  );
}

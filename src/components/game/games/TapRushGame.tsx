import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { color, space, typeface } from '@/theme/tokens';
import { CountdownRing } from '../CountdownRing';
import type { GameProps } from '../GameHost';

const DURATION = 5_000;

/** 시작 후 5초 동안 최대한 많이 탭. 점수 = 탭 수. */
export default function TapRushGame({ onFinish }: GameProps) {
  const [started, setStarted] = useState(false);
  const [taps, setTaps] = useState(0);
  const [left, setLeft] = useState(DURATION);
  const done = useRef(false);
  const bump = useSharedValue(1);

  useEffect(() => {
    if (!started) return;
    const tick = setInterval(() => setLeft((l) => Math.max(0, l - 100)), 100);
    return () => clearInterval(tick);
  }, [started]);

  useEffect(() => {
    if (started && left === 0 && !done.current) {
      done.current = true;
      onFinish(taps);
    }
  }, [started, left, taps, onFinish]);

  // 탭마다 숫자가 튄다 — 연타 게임은 손의 리듬이 화면에 보여야 신이 난다
  const counter = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));

  return (
    <View style={{ alignItems: 'center' }}>
      {started && <CountdownRing durationMs={DURATION} label={`${(left / 1000).toFixed(1)}`} caption="초" />}

      <Pressable
        // 연타는 닿는 순간 세야 한다 — onPress는 릴리스까지 기다리는 데다
        // 바깥 ScrollView가 responder를 가져가면 그 탭이 통째로 사라진다
        onPressIn={() => {
          if (!started) {
            setStarted(true);
            setTaps(1); // 시작 탭도 한 번으로 친다
          } else if (left > 0) {
            setTaps((t) => t + 1);
          }
          bump.value = withSequence(
            withTiming(1.18, { duration: 45 }),
            withSpring(1, { damping: 9, stiffness: 380 }),
          );
        }}
        style={{
          width: '100%',
          height: 260,
          borderRadius: 16,
          marginTop: started ? space[3] : 0,
          backgroundColor: color.greenCore,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View style={counter}>
          <Text
            style={{ fontFamily: typeface, fontWeight: '800', fontSize: 56, color: color.onPrimary }}
          >
            {taps}
          </Text>
        </Animated.View>
        {!started && (
          <Text style={{ fontFamily: typeface, color: color.onPrimary, marginTop: space[2] }}>
            탭해서 시작 — 5초 연타!
          </Text>
        )}
      </Pressable>
    </View>
  );
}

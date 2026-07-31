import { useEffect, useRef, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { color, space, typeface } from '@/theme/tokens';
import type { GameProps } from '../GameHost';

const DURATION = 10_000;

/** 시작 후 10초 동안 최대한 많이 탭. 점수 = 탭 수. */
export default function TapRushGame({ onFinish }: GameProps) {
  const [started, setStarted] = useState(false);
  const [taps, setTaps] = useState(0);
  const [left, setLeft] = useState(DURATION);
  const done = useRef(false);

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

  return (
    <Pressable
      onPress={() => {
        if (!started) {
          setStarted(true);
          setTaps(1); // 시작 탭도 한 번으로 친다
        } else if (left > 0) {
          setTaps((t) => t + 1);
        }
      }}
      style={{
        height: 300,
        borderRadius: 16,
        backgroundColor: color.greenCore,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 40, color: color.onPrimary }}>
        {taps}
      </Text>
      <Text style={{ fontFamily: typeface, color: color.onPrimary, marginTop: space[2] }}>
        {started ? `${(left / 1000).toFixed(1)}초` : '탭해서 시작 — 10초 연타!'}
      </Text>
    </Pressable>
  );
}

import { useRef, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { color, space, typeface } from '@/theme/tokens';
import type { GameProps } from '../GameHost';

/** 회차를 바꾸면 GAME_CATALOG의 blurb도 같이 고칠 것 */
const ROUNDS = 4;
const PENALTY_MS = 1000;

/** 초록으로 바뀌면 탭. 5회 평균 ms. 초록 전에 누르면 그 회차는 페널티(1000ms). */
export default function ReactionGame({ onFinish }: GameProps) {
  const [state, setState] = useState<'wait' | 'ready' | 'now'>('wait');
  const [times, setTimes] = useState<number[]>([]);
  const shownAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function arm() {
    setState('ready');
    // 대기 시간은 매번 무작위여야 한다 — 규칙적이면 리듬만 외워서 누른다.
    // 판이 늘어지지 않게 짧게 잡되, 예측을 막을 만큼의 폭(0.8~2.0초)은 남긴다.
    const delay = 800 + Math.random() * 1200;
    timer.current = setTimeout(() => {
      shownAt.current = Date.now();
      setState('now');
    }, delay);
  }

  function tap() {
    if (state === 'wait') {
      arm();
      return;
    }
    if (state === 'ready') {
      if (timer.current) clearTimeout(timer.current);
      record(PENALTY_MS); // 성급한 탭
      return;
    }
    record(Date.now() - shownAt.current);
  }

  function record(ms: number) {
    const next = [...times, ms];
    setTimes(next);
    if (next.length >= ROUNDS) {
      onFinish(Math.round(next.reduce((a, b) => a + b, 0) / next.length));
      return;
    }
    setState('wait');
  }

  const bg = state === 'now' ? color.greenCore : state === 'ready' ? color.danger : color.surface2;
  const label =
    state === 'now' ? '지금!' : state === 'ready' ? '기다려…' : `탭해서 시작 (${times.length + 1}/${ROUNDS})`;

  return (
    <Pressable
      onPress={tap}
      style={{
        height: 300,
        borderRadius: 16,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 22, color: color.white }}>
        {label}
      </Text>
      {times.length > 0 && (
        <Text style={{ fontFamily: typeface, color: color.white, marginTop: space[3] }}>
          {times[times.length - 1] === PENALTY_MS ? '너무 빨라요 (+1000ms)' : `${times[times.length - 1]}ms`}
        </Text>
      )}
    </Pressable>
  );
}

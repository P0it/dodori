import { useEffect, useRef, useState } from 'react';
import { Pressable, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { color, space, typeface } from '@/theme/tokens';
import type { GameProps } from '../GameHost';

const PENALTY_MS = 1000;

/** 초록으로 바뀌면 탭. 한 판에 한 번, 그 ms가 점수. 초록 전에 누르면 페널티(1000ms). */
export default function ReactionGame({ onFinish }: GameProps) {
  const [state, setState] = useState<'wait' | 'ready' | 'now'>('wait');
  const shownAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 초록을 치는 손은 대개 한 번 더 튄다 — 그 두 번째 탭이 판을 하나 더 기록했다
  const done = useRef(false);
  const pulse = useSharedValue(1);

  // 초록이 뜨는 순간 화면이 한 번 튀어야 "지금"이 눈에 박힌다.
  // 초록 전(ready)에는 아무 움직임도 주지 않는다 — 미세한 변화도 예고가 되면 측정이 무의미해진다.
  useEffect(() => {
    if (state !== 'now') return;
    pulse.value = 1.06;
    pulse.value = withSpring(1, { damping: 8, stiffness: 300 });
  }, [state, pulse]);

  const surface = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

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
    if (done.current) return;
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
    done.current = true;
    onFinish(ms);
  }

  const bg = state === 'now' ? color.greenCore : state === 'ready' ? color.danger : color.surface2;
  const label = state === 'now' ? '지금!' : state === 'ready' ? '기다려…' : '탭해서 시작';

  return (
    <Animated.View style={surface}>
      <Pressable
        // 손을 뗄 때가 아니라 닿는 순간 — onPress는 반응속도에 릴리스 시간이 얹히고,
        // 손가락이 조금이라도 밀리면 바깥 ScrollView가 responder를 가져가 아예 취소된다
        onPressIn={tap}
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
        <Text
          style={{
            fontFamily: typeface,
            color: color.white,
            opacity: 0.8,
            marginTop: space[3],
            fontSize: 13,
          }}
        >
          한 판에 한 번
        </Text>
      </Pressable>
    </Animated.View>
  );
}

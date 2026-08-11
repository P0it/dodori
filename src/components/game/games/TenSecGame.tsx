import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { color, space, typeface } from '@/theme/tokens';
import type { GameProps } from '../GameHost';

/** 목표 시간 — 바꾸면 GAME_CATALOG의 name·blurb도 같이 고칠 것 */
const TARGET_MS = 7_000;

function fmt(ms: number) {
  return (ms / 1000).toFixed(3);
}

/**
 * 시작을 누르면 밀리초 타이머가 눈앞에서 올라간다. 7.000초에 맞춰 정지. 점수 = 오차(ms).
 * 감(내부 시계)이 아니라 눈과 손의 타이밍 게임 — 그래서 타이머를 보여준다.
 */
export default function TenSecGame({ onFinish }: GameProps) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);

  // 화면 갱신은 rAF로 — 100ms 인터벌이면 세 번째 자리가 뛰어서 조준할 수가 없다
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const loop = () => {
      setElapsed(Date.now() - startedAt.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  function toggle() {
    if (!running) {
      startedAt.current = Date.now();
      setElapsed(0);
      setRunning(true);
      return;
    }
    // 점수는 화면 값이 아니라 탭한 순간으로 — 렌더 지연이 오차에 섞이면 안 된다
    onFinish(Math.abs(Date.now() - startedAt.current - TARGET_MS));
  }

  const past = elapsed > TARGET_MS;

  return (
    <Pressable
      // 정지 판정은 닿는 순간 — 릴리스까지 기다리면 그만큼이 오차로 얹힌다
      onPressIn={toggle}
      style={{
        height: 300,
        borderRadius: 16,
        backgroundColor: running ? color.surface3 : color.surface2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text
          style={{
            fontFamily: typeface,
            fontWeight: '800',
            fontSize: 56,
            color: past ? color.sub : color.white,
            fontVariant: ['tabular-nums'],
          }}
        >
          {fmt(elapsed)}
        </Text>
        <Text
          style={{
            fontFamily: typeface,
            fontWeight: '800',
            fontSize: 22,
            color: color.sub,
            marginLeft: space[1],
          }}
        >
          초
        </Text>
      </View>

      <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 18, color: color.greenCore, marginTop: space[3] }}>
        {running ? '7.000에서 탭!' : '탭하면 시작'}
      </Text>
      <Text style={{ fontFamily: typeface, color: color.sub, marginTop: space[2] }}>
        목표 7.000초 — 오차가 작을수록 이긴다
      </Text>
    </Pressable>
  );
}

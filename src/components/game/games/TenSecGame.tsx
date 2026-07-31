import { useRef, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { color, space, typeface } from '@/theme/tokens';
import type { GameProps } from '../GameHost';

/** 목표 시간 — 바꾸면 GAME_CATALOG의 name·blurb도 같이 고칠 것 */
const TARGET_MS = 7_000;

/** 시작을 누른 뒤 타이머를 숨긴 채 목표 시간에 맞춰 정지. 점수 = 오차(ms). */
export default function TenSecGame({ onFinish }: GameProps) {
  const [running, setRunning] = useState(false);
  const startedAt = useRef(0);

  function toggle() {
    if (!running) {
      startedAt.current = Date.now();
      setRunning(true);
      return;
    }
    onFinish(Math.abs(Date.now() - startedAt.current - TARGET_MS));
  }

  return (
    <Pressable
      onPress={toggle}
      style={{
        height: 300,
        borderRadius: 16,
        backgroundColor: running ? color.surface3 : color.surface2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 22, color: color.white }}>
        {running ? '7초라고 느껴지면 탭' : '탭하면 시작'}
      </Text>
      <Text style={{ fontFamily: typeface, color: color.sub, marginTop: space[3] }}>
        {running ? '타이머는 숨겨져 있어요' : '7.000초에 정지하세요'}
      </Text>
    </Pressable>
  );
}

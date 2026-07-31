import { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { color, space, typeface } from '@/theme/tokens';
import type { GameProps } from '../GameHost';

/** 4x4. 개수를 바꾸면 GAME_CATALOG의 blurb와 아래 그리드 폭(COLS)도 같이 고칠 것 */
const N = 16;
const COLS = 4;

/** 흩어진 1~16을 순서대로. 1을 누르면 타이머 시작, 마지막에서 종료. 점수 = 걸린 시간(ms). */
export default function SequenceGame({ onFinish }: GameProps) {
  // 배치는 판마다 새로 섞는다 — 고정이면 두 번째 판부터 위치를 외운 사람이 이긴다
  const layout = useMemo(() => {
    const arr = Array.from({ length: N }, (_, i) => i + 1);
    for (let i = N - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, []);
  const [next, setNext] = useState(1);
  const startedAt = useRef(0);

  function tap(v: number) {
    if (v !== next) return;
    if (v === 1) startedAt.current = Date.now();
    if (v === N) {
      onFinish(Date.now() - startedAt.current);
      return;
    }
    setNext(v + 1);
  }

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontFamily: typeface, color: color.sub }}>다음: {next}</Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          width: COLS * 60,
          marginTop: space[3],
          justifyContent: 'center',
        }}
      >
        {layout.map((v) => (
          <Pressable
            key={v}
            onPress={() => tap(v)}
            style={{
              width: 56,
              height: 56,
              margin: 2,
              borderRadius: 8,
              backgroundColor: v < next ? color.surface1 : color.surface3,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: typeface,
                fontWeight: '700',
                color: v < next ? color.muted : color.white,
              }}
            >
              {v}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

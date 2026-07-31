import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { color, space, typeface } from '@/theme/tokens';
import type { GameProps } from '../GameHost';

/** 길이를 바꾸면 GAME_CATALOG의 blurb도 같이 고칠 것 */
const DURATION = 10_000;
const CELLS = 9;
const HOP_MS = 700;

/** 3x3 그리드에서 한 칸만 활성. 그 칸을 누르면 +1. */
export default function WhackGame({ onFinish }: GameProps) {
  const [active, setActive] = useState(() => Math.floor(Math.random() * CELLS));
  const [hits, setHits] = useState(0);
  const [left, setLeft] = useState(DURATION);
  const done = useRef(false);

  useEffect(() => {
    const hop = setInterval(() => {
      setActive((prev) => {
        const n = Math.floor(Math.random() * CELLS);
        return n === prev ? (n + 1) % CELLS : n; // 같은 칸에 연속으로 나오지 않게
      });
    }, HOP_MS);
    const tick = setInterval(() => setLeft((l) => Math.max(0, l - 100)), 100);
    return () => {
      clearInterval(hop);
      clearInterval(tick);
    };
  }, []);

  // 종료는 여기 한 곳만 담당한다 — setTimeout에서 부르면 낡은 hits가 캡처된다
  useEffect(() => {
    if (left === 0 && !done.current) {
      done.current = true;
      onFinish(hits);
    }
  }, [left, hits, onFinish]);

  return (
    <View>
      <Text style={{ fontFamily: typeface, color: color.sub, textAlign: 'center' }}>
        {(left / 1000).toFixed(1)}초 · {hits}마리
      </Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: space[2],
          marginTop: space[3],
          justifyContent: 'center',
        }}
      >
        {Array.from({ length: CELLS }, (_, i) => (
          <Pressable
            key={i}
            onPress={() => {
              if (i === active && left > 0) setHits((h) => h + 1);
            }}
            style={{
              width: 92,
              height: 92,
              borderRadius: 12,
              backgroundColor: i === active ? color.greenCore : color.surface2,
            }}
          />
        ))}
      </View>
    </View>
  );
}

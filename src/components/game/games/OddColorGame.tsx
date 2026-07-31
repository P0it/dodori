import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
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

  function pick(i: number) {
    if (i === odd) setLevel((l) => l + 1);
    else onFinish(level - 1);
  }

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontFamily: typeface, fontWeight: '700', color: color.white }}>{level}단계</Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          width: cols * 56,
          marginTop: space[3],
          gap: 4,
          justifyContent: 'center',
        }}
      >
        {Array.from({ length: count }, (_, i) => (
          <Pressable
            key={i}
            onPress={() => pick(i)}
            style={{
              width: 52,
              height: 52,
              borderRadius: 8,
              backgroundColor: i === odd ? oddColor : baseColor,
            }}
          />
        ))}
      </View>
    </View>
  );
}

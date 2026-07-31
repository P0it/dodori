import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { color, space, typeface } from '@/theme/tokens';
import type { GameProps } from '../GameHost';

const DURATION = 30_000;
const WORDS = [
  { label: '빨강', key: 'red', hex: color.holiday },
  { label: '초록', key: 'green', hex: color.accent },
  { label: '파랑', key: 'blue', hex: color.saturday },
  { label: '노랑', key: 'yellow', hex: color.anniv },
];

/** 글자의 뜻이 아니라 '글자색'을 고른다. 30초간 맞힌 수. */
export default function StroopGame({ onFinish }: GameProps) {
  const [n, setN] = useState(0);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(DURATION);
  const done = useRef(false);

  // 문제마다 새로 뽑는다. 뜻과 색이 같으면 함정이 성립하지 않아 반드시 어긋나게 한다.
  const { word, ink } = useMemo(() => {
    const w = Math.floor(Math.random() * WORDS.length);
    let i = Math.floor(Math.random() * WORDS.length);
    if (i === w) i = (i + 1) % WORDS.length;
    return { word: WORDS[w], ink: WORDS[i] };
  }, [n]);

  useEffect(() => {
    const tick = setInterval(() => setLeft((l) => Math.max(0, l - 100)), 100);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (left === 0 && !done.current) {
      done.current = true;
      onFinish(score);
    }
  }, [left, score, onFinish]);

  function choose(key: string) {
    if (left === 0) return;
    if (key === ink.key) setScore((s) => s + 1);
    setN((v) => v + 1);
  }

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontFamily: typeface, color: color.sub }}>
        {(left / 1000).toFixed(0)}초 · {score}개
      </Text>
      <Text
        style={{
          fontFamily: typeface,
          fontWeight: '900',
          fontSize: 56,
          color: ink.hex,
          marginVertical: space[5],
        }}
      >
        {word.label}
      </Text>
      <View
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2], justifyContent: 'center' }}
      >
        {WORDS.map((w) => (
          <Pressable
            key={w.key}
            onPress={() => choose(w.key)}
            style={{
              paddingHorizontal: space[5],
              paddingVertical: space[3],
              borderRadius: 10,
              backgroundColor: color.surface2,
            }}
          >
            <Text
              style={{ fontFamily: typeface, fontWeight: '700', fontSize: 18, color: color.white }}
            >
              {w.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

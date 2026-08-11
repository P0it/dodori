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

/** 길이를 바꾸면 GAME_CATALOG의 blurb도 같이 고칠 것 */
const DURATION = 15_000;
const WORDS = [
  { label: '빨강', key: 'red', hex: color.holiday },
  { label: '초록', key: 'green', hex: color.accent },
  { label: '파랑', key: 'blue', hex: color.saturday },
  { label: '노랑', key: 'yellow', hex: color.anniv },
];

/** 뜻과 색이 같으면 함정이 성립하지 않아 반드시 어긋나게 뽑는다. */
function nextQuestion() {
  const w = Math.floor(Math.random() * WORDS.length);
  let i = Math.floor(Math.random() * WORDS.length);
  if (i === w) i = (i + 1) % WORDS.length;
  return { word: WORDS[w], ink: WORDS[i] };
}

/** 글자의 뜻이 아니라 '글자색'을 고른다. 제한 시간 안에 맞힌 수. */
export default function StroopGame({ onFinish }: GameProps) {
  // 문제는 state로 든다 — useMemo는 React Compiler가 의존성을 다시 추론해
  // (콜백이 카운터를 읽지 않으므로) 최초 1회만 계산하고 영영 갱신되지 않는다
  const [{ word, ink }, setQuestion] = useState(nextQuestion);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(DURATION);
  const done = useRef(false);
  const enter = useSharedValue(1);
  const shake = useSharedValue(0);

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
    if (key === ink.key) {
      setScore((s) => s + 1);
      // 맞으면 다음 문제가 튀어나오듯 들어온다
      enter.value = withSequence(withTiming(0.7, { duration: 60 }), withSpring(1, { damping: 10 }));
    } else {
      // 틀리면 좌우로 한 번 — 오답도 즉시 알아야 다음 문제에 반영된다
      shake.value = withSequence(
        withTiming(-8, { duration: 45 }),
        withTiming(8, { duration: 60 }),
        withTiming(0, { duration: 45 }),
      );
    }
    setQuestion(nextQuestion());
  }

  const prompt = useAnimatedStyle(() => ({
    transform: [{ scale: enter.value }, { translateX: shake.value }],
  }));

  return (
    <View style={{ alignItems: 'center' }}>
      <CountdownRing durationMs={DURATION} label={`${score}`} caption="개" />

      <Animated.View style={prompt}>
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
      </Animated.View>

      <View
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2], justifyContent: 'center' }}
      >
        {WORDS.map((w) => (
          <Pressable
            key={w.key}
            onPressIn={() => choose(w.key)}
            style={({ pressed }) => ({
              paddingHorizontal: space[5],
              paddingVertical: space[3],
              borderRadius: 10,
              backgroundColor: pressed ? color.surface3 : color.surface2,
            })}
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

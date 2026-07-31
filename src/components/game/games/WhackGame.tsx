import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { color, space } from '@/theme/tokens';
import { CountdownRing } from '../CountdownRing';
import type { GameProps } from '../GameHost';

/** 길이를 바꾸면 GAME_CATALOG의 blurb도 같이 고칠 것 */
const DURATION = 8_000;
const CELLS = 9;
// 짧아진 만큼 더 자주 옮겨다녀야 점수 폭이 유지된다 (8초 ÷ 0.6초 ≈ 13번)
const HOP_MS = 600;

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
    <View style={{ alignItems: 'center' }}>
      <CountdownRing durationMs={DURATION} label={`${hits}`} caption="마리" />
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: space[2],
          marginTop: space[4],
          justifyContent: 'center',
        }}
      >
        {Array.from({ length: CELLS }, (_, i) => (
          <Hole
            key={i}
            active={i === active}
            onHit={() => {
              if (i === active && left > 0) setHits((h) => h + 1);
            }}
          />
        ))}
      </View>
    </View>
  );
}

/** 한 칸 — 두더지가 튀어나올 때 스프링으로 솟고, 맞으면 한 번 움츠렸다 사라진다 */
function Hole({ active, onHit }: { active: boolean; onHit: () => void }) {
  const pop = useSharedValue(0);

  useEffect(() => {
    pop.value = active ? withSpring(1, { damping: 11, stiffness: 260 }) : withTiming(0, { duration: 110 });
  }, [active, pop]);

  const mole = useAnimatedStyle(() => ({
    transform: [{ scale: 0.4 + pop.value * 0.6 }],
    opacity: pop.value,
  }));

  return (
    <Pressable
      onPress={() => {
        if (!active) return;
        // 맞은 순간 즉시 움츠러들게 — 다음 칸으로 넘어가기 전에 반응이 보인다
        pop.value = withSequence(withTiming(1.15, { duration: 60 }), withTiming(0, { duration: 90 }));
        onHit();
      }}
      style={{
        width: 92,
        height: 92,
        borderRadius: 12,
        backgroundColor: color.surface2,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={[
          { width: '100%', height: '100%', borderRadius: 12, backgroundColor: color.greenCore },
          mole,
        ]}
      />
    </Pressable>
  );
}

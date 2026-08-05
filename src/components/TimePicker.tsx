import { useEffect, useRef } from 'react';
import {
  Platform,
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { color, typeface } from '@/theme/tokens';
import { fromMinutes, isHHmm, minuteOptions, snapMinute, type HHmm } from '@/lib/time';

const ROW = 40;
/** 가운데 줄 위아래로 보이는 줄 수 — 휠 높이는 (VISIBLE*2+1) * ROW */
const VISIBLE = 1;
const HEIGHT = (VISIBLE * 2 + 1) * ROW;
/** 휠 바깥 여백 — 가운데 선택 줄의 top 계산에 그대로 쓰인다 */
const PAD = 10;

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = minuteOptions();

/**
 * 시각 선택 휠 — 시/분을 각각 세로로 굴려 고른다. 'HH:mm' in/out.
 * 5분 눈금에 없는 값(서버에 이미 있는 19:23 등)이 들어오면 휠은 가장 가까운 아래 칸에 선다.
 * props-only.
 */
export function TimePicker({ value, onChange }: { value: HHmm; onChange: (t: HHmm) => void }) {
  const snapped = isHHmm(value) ? snapMinute(value) : '19:00';
  const [h, m] = snapped.split(':').map(Number);

  const set = (hour: number, minute: number) => onChange(fromMinutes(hour * 60 + minute));

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        borderRadius: 14,
        backgroundColor: color.surface1,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        paddingVertical: PAD,
      }}
    >
      {/* 가운데 선택 줄 — 휠 뒤에 깔아 어느 칸이 선택인지 눈으로 잡아준다 */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 12,
          right: 12,
          top: PAD + VISIBLE * ROW,
          height: ROW,
          borderRadius: 10,
          backgroundColor: color.surface2,
        }}
      />
      <Wheel items={HOURS} value={h} onSelect={(v) => set(v, m)} label="시" />
      <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 18, color: color.sub }}>:</Text>
      <Wheel items={MINUTES} value={m} onSelect={(v) => set(h, v)} label="분" />
    </View>
  );
}

/** 스크롤 위치 → 가운데 칸 번호 (범위 밖은 끝 칸으로) */
function rowAt(y: number, count: number): number {
  return Math.min(count - 1, Math.max(0, Math.round(y / ROW)));
}

function Wheel({
  items,
  value,
  onSelect,
  label,
}: {
  items: number[];
  value: number;
  onSelect: (v: number) => void;
  label: string;
}) {
  const ref = useRef<ScrollView>(null);
  const index = Math.max(0, items.indexOf(value));

  const commit = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = items[rowAt(e.nativeEvent.contentOffset.y, items.length)];
    if (next !== value) onSelect(next);
  };

  /**
   * 웹(react-native-web)은 onScrollEndDrag·onMomentumScrollEnd를 아예 발생시키지 않는다
   * (ScrollViewBase가 DOM에 onScroll만 연결한다) — 굴려도 값이 영영 확정되지 않았다.
   * 그래서 onScroll이 멎는 것을 스크롤 끝으로 보고 확정한다. snapToInterval도 웹엔 없어
   * 여기서 직접 칸에 맞춘다.
   */
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (idle.current) clearTimeout(idle.current); }, []);
  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => {
      const i = rowAt(y, items.length);
      ref.current?.scrollTo({ y: i * ROW, animated: true });
      if (items[i] !== value) onSelect(items[i]);
    }, 140);
  };

  return (
    <ScrollView
      ref={ref}
      accessibilityLabel={label}
      style={{ height: HEIGHT, width: 74 }}
      showsVerticalScrollIndicator={false}
      snapToInterval={ROW}
      decelerationRate="fast"
      // 스크롤이 멈춘 뒤에만 확정 — 굴리는 중에 값이 바뀌면 리렌더가 휠을 잡아챈다
      onMomentumScrollEnd={commit}
      onScrollEndDrag={commit}
      {...(Platform.OS === 'web' ? { onScroll: settle, scrollEventThrottle: 16 } : null)}
      contentOffset={{ x: 0, y: index * ROW }}
      // 마운트 시점엔 콘텐츠가 아직 안 깔려 contentOffset이 0으로 잘릴 수 있다
      onContentSizeChange={() => ref.current?.scrollTo({ y: index * ROW, animated: false })}
      contentContainerStyle={{ paddingVertical: VISIBLE * ROW }}
    >
      {items.map((n) => {
        const on = n === value;
        return (
          <View key={n} style={{ height: ROW, alignItems: 'center', justifyContent: 'center' }}>
            <Text
              style={{
                fontFamily: typeface,
                fontWeight: on ? '800' : '600',
                fontSize: on ? 20 : 17,
                color: on ? color.white : color.muted,
              }}
            >
              {String(n).padStart(2, '0')}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

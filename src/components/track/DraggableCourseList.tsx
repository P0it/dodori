import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withSpring,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';

/**
 * 짧은 코스 목록 전용 드래그 재정렬 — 라이브러리 없이 reanimated + gesture-handler로 자체 구현.
 * 행 높이 고정 + 절대배치. 행을 길게 눌러 들어올린 뒤 세로로 드래그, 놓으면 새 순서를 확정한다.
 * (가상 리스트가 아니므로 전체 화면 ScrollView 안에 중첩해도 안전 — 항목은 보통 2~6개)
 */

type Positions = Record<string, number>;

const SPRING = { damping: 20, stiffness: 220 } as const;

type Props = {
  /** 현재 순서의 placeId 배열 (부모가 sort_order로 정렬해 전달) */
  ids: string[];
  rowHeight: number;
  renderItem: (id: string, dragging: boolean) => ReactNode;
  /** 드롭 시 새 순서(placeId[]) */
  onReorder: (orderedIds: string[]) => void;
  /** 드래그 중 부모 ScrollView 잠금용 */
  onDragActiveChange?: (active: boolean) => void;
};

export function DraggableCourseList({ ids, rowHeight, renderItem, onReorder, onDragActiveChange }: Props) {
  const positions = useSharedValue<Positions>(Object.fromEntries(ids.map((id, i) => [id, i])));
  const activeId = useSharedValue<string | null>(null);

  // ids가 바뀌면(장소 추가/삭제·재정렬 확정) 드래그 중이 아닐 때 재동기화
  const idsKey = ids.join('|');
  useEffect(() => {
    if (activeId.value == null) {
      positions.value = Object.fromEntries(ids.map((id, i) => [id, i]));
    }
    // idsKey에만 반응 — positions/activeId는 안정적인 shared value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return (
    <View style={{ height: ids.length * rowHeight }}>
      {ids.map((id, index) => (
        <DraggableRow
          key={id}
          id={id}
          index={index}
          count={ids.length}
          rowHeight={rowHeight}
          positions={positions}
          activeId={activeId}
          renderItem={renderItem}
          onReorder={onReorder}
          onDragActiveChange={onDragActiveChange}
        />
      ))}
    </View>
  );
}

function DraggableRow({
  id,
  index,
  count,
  rowHeight,
  positions,
  activeId,
  renderItem,
  onReorder,
  onDragActiveChange,
}: {
  id: string;
  index: number;
  count: number;
  rowHeight: number;
  positions: SharedValue<Positions>;
  activeId: SharedValue<string | null>;
  renderItem: (id: string, dragging: boolean) => ReactNode;
  onReorder: (orderedIds: string[]) => void;
  onDragActiveChange?: (active: boolean) => void;
}) {
  const isActive = useSharedValue(false);
  const top = useSharedValue((positions.value[id] ?? index) * rowHeight);
  const startTop = useSharedValue(0);
  const [dragging, setDragging] = useState(false);

  // 다른 행이 밀려날 때 spring으로 자리 이동 (활성 행 자신은 손가락을 따라가므로 제외)
  useAnimatedReaction(
    () => positions.value[id],
    (idx, prev) => {
      if (idx == null) return;
      if (!isActive.value && idx !== prev) {
        top.value = withSpring(idx * rowHeight, SPRING);
      }
    },
  );

  useAnimatedReaction(
    () => isActive.value,
    (v, prev) => {
      if (v !== prev) runOnJS(setDragging)(v);
    },
  );

  const pan = Gesture.Pan()
    .activateAfterLongPress(180)
    .onStart(() => {
      isActive.value = true;
      activeId.value = id;
      startTop.value = (positions.value[id] ?? index) * rowHeight;
      top.value = startTop.value;
      if (onDragActiveChange) runOnJS(onDragActiveChange)(true);
    })
    .onUpdate((e) => {
      top.value = startTop.value + e.translationY;
      const newIndex = Math.max(0, Math.min(count - 1, Math.round(top.value / rowHeight)));
      const curIndex = positions.value[id];
      if (curIndex != null && newIndex !== curIndex) {
        const next = { ...positions.value };
        for (const k in next) {
          if (next[k] === newIndex) next[k] = curIndex;
        }
        next[id] = newIndex;
        positions.value = next;
      }
    })
    .onEnd(() => {
      top.value = withSpring((positions.value[id] ?? index) * rowHeight, SPRING);
    })
    .onFinalize(() => {
      if (!isActive.value) return;
      isActive.value = false;
      activeId.value = null;
      if (onDragActiveChange) runOnJS(onDragActiveChange)(false);
      const pos = positions.value;
      const order = Object.keys(pos).sort((a, b) => pos[a] - pos[b]);
      runOnJS(onReorder)(order);
    });

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: 0,
    right: 0,
    top: top.value,
    height: rowHeight,
    zIndex: isActive.value ? 20 : 0,
    transform: [{ scale: withSpring(isActive.value ? 1.03 : 1, SPRING) }],
    opacity: isActive.value ? 0.96 : 1,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={style}>{renderItem(id, dragging)}</Animated.View>
    </GestureDetector>
  );
}

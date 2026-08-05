import { useEffect } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector, type GestureType } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import {
  OVERLAY_SIZE_MAX,
  OVERLAY_SIZE_MIN,
  type Rect,
  type TextOverlay,
} from '@/lib/stories';
import { overlayTextStyle } from './StoryTextLayer';

type Props = {
  overlays: TextOverlay[];
  /** 프레임 안에서 사진이 실제로 차지하는 사각형 */
  rect: Rect;
  /** 손을 뗐을 때 확정된 위치·크기·회전 */
  onChange: (overlay: TextOverlay) => void;
  /** 탭 — 내용·색 고치기 */
  onEdit: (overlay: TextOverlay) => void;
  /**
   * 글자를 잡았을 때 막아야 할 바깥 제스처들 (밑에 깔린 사진 캔버스의 팬·핀치·더블탭).
   * 캔버스와 이 레이어는 형제 뷰라 RNGH가 알아서 우선순위를 정하지 않는다 —
   * 명시하지 않으면 글자를 끄는 동안 사진까지 같이 끌린다.
   */
  blocks?: React.MutableRefObject<GestureType | undefined>[];
};

/** 편집용 텍스트 레이어 — 끌어서 옮기고, 오므려서 키우고, 돌려서 기울인다 */
export function StoryTextEditor({ overlays, rect, onChange, onEdit, blocks }: Props) {
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
    >
      {overlays.map((o) => (
        <EditableText key={o.id} overlay={o} rect={rect} onChange={onChange} onEdit={onEdit} blocks={blocks} />
      ))}
    </View>
  );
}

function EditableText({
  overlay,
  rect,
  onChange,
  onEdit,
  blocks,
}: {
  overlay: TextOverlay;
  rect: Rect;
  onChange: (overlay: TextOverlay) => void;
  onEdit: (overlay: TextOverlay) => void;
  blocks?: React.MutableRefObject<GestureType | undefined>[];
}) {
  const x = useSharedValue(overlay.x);
  const y = useSharedValue(overlay.y);
  const size = useSharedValue(overlay.size);
  const rotation = useSharedValue(overlay.rotation);

  // 시트에서 내용·색을 고치고 돌아왔을 때 값이 되돌아가지 않게 맞춘다
  useEffect(() => {
    x.value = overlay.x;
    y.value = overlay.y;
    size.value = overlay.size;
    rotation.value = overlay.rotation;
  }, [overlay, x, y, size, rotation]);

  const commit = () =>
    onChange({ ...overlay, x: x.value, y: y.value, size: size.value, rotation: rotation.value });

  // 글자를 잡는 순간 밑에 깔린 캔버스 제스처를 막는다 — 없으면 글자와 사진이 함께 움직인다
  const outer = blocks ?? [];

  const pan = Gesture.Pan()
    .blocksExternalGesture(...outer)
    .onChange((e) => {
      x.value = Math.min(1, Math.max(0, x.value + e.changeX / rect.width));
      y.value = Math.min(1, Math.max(0, y.value + e.changeY / rect.height));
    })
    .onEnd(() => runOnJS(commit)());

  const pinch = Gesture.Pinch()
    .blocksExternalGesture(...outer)
    .onChange((e) => {
      size.value = Math.min(
        OVERLAY_SIZE_MAX,
        Math.max(OVERLAY_SIZE_MIN, size.value * e.scaleChange),
      );
    })
    .onEnd(() => runOnJS(commit)());

  const rotate = Gesture.Rotation()
    .blocksExternalGesture(...outer)
    .onChange((e) => {
      rotation.value += (e.rotationChange * 180) / Math.PI;
    })
    .onEnd(() => runOnJS(commit)());

  const tap = Gesture.Tap()
    .blocksExternalGesture(...outer)
    .onEnd(() => runOnJS(onEdit)(overlay));

  // 탭은 움직이기 시작하면 진다 — 나머지 셋은 동시에 먹는다
  const gesture = Gesture.Simultaneous(Gesture.Race(tap, pan), pinch, rotate);

  const box = useAnimatedStyle(() => ({
    transform: [
      { translateX: (x.value - 0.5) * rect.width },
      { translateY: (y.value - 0.5) * rect.height },
      { rotate: `${rotation.value}deg` },
    ],
  }));
  const text = useAnimatedStyle(() => ({
    fontSize: rect.width * size.value,
    lineHeight: rect.width * size.value * 1.25,
  }));

  return (
    // 글자 크기만큼만 터치를 먹도록 — 사각형 전체를 덮으면 아래 텍스트가 눌리지 않는다
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <GestureDetector gesture={gesture}>
        {/*
          글자 딱 만큼이면 잡기가 어렵다 — 여백을 둬서 손가락이 닿을 자리를 만든다.
          핀치·회전은 두 손가락이 모두 이 상자 안에 들어와야 이 글자에 먹으므로
          한 손가락이 글자를 잡는 폭보다 넉넉히 크게 잡는다.
          (예전엔 손가락이 밖으로 나가면 캔버스 핀치로 "새는" 문제도 있었지만,
           그건 이제 blocksExternalGesture가 막는다 — 여백은 잡기 편하라고만 남긴다)
        */}
        <Animated.View style={[{ paddingHorizontal: 36, paddingVertical: 28 }, box]}>
          <Animated.Text style={[overlayTextStyle(overlay, rect), text]}>
            {overlay.text}
          </Animated.Text>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

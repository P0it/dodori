import { useEffect, useRef } from 'react';
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
  OVERLAY_WIDTH_RATIO,
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

/**
 * 두 손가락(핀치·회전)이 이 글자에 먹는 범위 — 글자 **위아래로만** 넉넉하게.
 *
 * 옆으로 넓히면 안 된다: 글자 상자는 이미 캔버스의 9할까지 쓰므로 좌우로 조금만 더 줘도
 * 화면 폭을 다 덮어 버리고, 그러면 사진을 오므리려는 두 손가락이 번번이 글자에 걸려
 * 사진이 안 줄어든다.
 */
const ZOOM_PAD_Y = 56;

/** 한 손가락(끌기·탭)이 먹는 범위 — 글자 좌우로 이만큼. 캔버스 폭의 남은 1할을 반씩 나눈다 */
const grabPadX = (rectWidth: number) => (rectWidth * (1 - OVERLAY_WIDTH_RATIO)) / 2;

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

  // 한 손가락(탭·팬)은 좁은 상자, 두 손가락(핀치·회전)은 넓은 상자에 붙는다.
  // 두 상자가 겹쳐 있으니 서로 물러서지 않도록 명시해 준다
  const panRef = useRef<GestureType | undefined>(undefined);
  const pinchRef = useRef<GestureType | undefined>(undefined);
  const rotateRef = useRef<GestureType | undefined>(undefined);

  const pan = Gesture.Pan()
    .withRef(panRef)
    .simultaneousWithExternalGesture(pinchRef, rotateRef)
    .blocksExternalGesture(...outer)
    .onChange((e) => {
      x.value = Math.min(1, Math.max(0, x.value + e.changeX / rect.width));
      y.value = Math.min(1, Math.max(0, y.value + e.changeY / rect.height));
    })
    .onEnd(() => runOnJS(commit)());

  const pinch = Gesture.Pinch()
    .withRef(pinchRef)
    .simultaneousWithExternalGesture(panRef)
    .blocksExternalGesture(...outer)
    .onChange((e) => {
      size.value = Math.min(
        OVERLAY_SIZE_MAX,
        Math.max(OVERLAY_SIZE_MIN, size.value * e.scaleChange),
      );
    })
    .onEnd(() => runOnJS(commit)());

  const rotate = Gesture.Rotation()
    .withRef(rotateRef)
    .simultaneousWithExternalGesture(panRef)
    .blocksExternalGesture(...outer)
    .onChange((e) => {
      rotation.value += (e.rotationChange * 180) / Math.PI;
    })
    .onEnd(() => runOnJS(commit)());

  const tap = Gesture.Tap()
    .blocksExternalGesture(...outer)
    .onEnd(() => runOnJS(onEdit)(overlay));

  // 탭은 움직이기 시작하면 진다
  const move = Gesture.Race(tap, pan);
  const zoom = Gesture.Simultaneous(pinch, rotate);

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
      {/*
        핀치·회전은 두 손가락이 **모두** 상자 안에 들어와야 이 글자에 먹는다.
        위아래로만 넓히는 이유는 ZOOM_PAD_Y 주석에 있다 — 옆으로 넓히면 사진 핀치가 죽는다.
      */}
      <GestureDetector gesture={zoom}>
        <Animated.View style={[{ paddingVertical: ZOOM_PAD_Y }, box]}>
          {/* 끌기·탭은 글자 좌우로 조금만 — 여기가 넓으면 글자 옆을 끌 때 사진이 안 움직인다 */}
          <GestureDetector gesture={move}>
            <View style={{ paddingHorizontal: grabPadX(rect.width), paddingVertical: 28 }}>
              <Animated.Text style={[overlayTextStyle(overlay, rect), text]}>
                {overlay.text}
              </Animated.Text>
            </View>
          </GestureDetector>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

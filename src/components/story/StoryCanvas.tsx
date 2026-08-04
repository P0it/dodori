import { useEffect } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  CANVAS_ZOOM_MAX,
  CANVAS_ZOOM_MIN,
  CANVAS_ZOOM_RUBBER,
  clampPan,
  coverScale,
} from '@/lib/stories';

/** 캔버스에 보이는 만큼만 저장된다 — 올릴 때 이 값으로 원본을 자른다 */
export interface CanvasTransform {
  /** cover 대비 배율 (1이면 딱 덮는 상태) */
  scale: number;
  tx: number;
  ty: number;
}

type Props = {
  uri: string;
  photoWidth: number;
  photoHeight: number;
  width: number;
  height: number;
  /** 손을 뗐을 때 확정된 구도 */
  onChange: (t: CanvasTransform) => void;
};

/**
 * 편집 캔버스의 사진 — 캔버스를 덮은 채로 오므려 키우고 끌어서 구도를 잡는다.
 *
 * 여백이 생기지 않는 게 이 컴포넌트의 계약이다. 팬은 매 프레임 clampPan으로 잘리고,
 * 배율은 1(=cover) 아래로 내려가지 않는다 — 1보다 작아지면 어느 축이든 검은 띠가 새고
 * 그 띠가 그대로 구워진다.
 */
export function StoryCanvas({
  uri,
  photoWidth,
  photoHeight,
  width,
  height,
  onChange,
}: Props) {
  const scale = useSharedValue(1);
  const saved = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  // 사진을 바꾸면 구도도 처음부터
  useEffect(() => {
    scale.value = 1;
    saved.value = 1;
    tx.value = 0;
    ty.value = 0;
    onChange({ scale: 1, tx: 0, ty: 0 });
    // onChange는 매 렌더 새 함수 — 사진이 바뀔 때만 되돌린다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri]);

  const commit = () => onChange({ scale: scale.value, tx: tx.value, ty: ty.value });

  const fit = () => {
    'worklet';
    const p = clampPan(photoWidth, photoHeight, width, height, scale.value, tx.value, ty.value);
    tx.value = p.tx;
    ty.value = p.ty;
  };

  const pan = Gesture.Pan()
    .onChange((e) => {
      tx.value += e.changeX;
      ty.value += e.changeY;
      fit();
    })
    .onEnd(() => runOnJS(commit)());

  const pinch = Gesture.Pinch()
    .onBegin(() => {
      saved.value = scale.value;
    })
    .onChange((e) => {
      const raw = saved.value * e.scale;
      // 1 위로는 그대로, 1 밑으로는 저항하며 따라 준다 (손을 떼면 되돌아간다)
      scale.value =
        raw >= 1
          ? Math.min(CANVAS_ZOOM_MAX, raw)
          : Math.max(CANVAS_ZOOM_MIN, 1 - (1 - raw) * CANVAS_ZOOM_RUBBER);
      fit();
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withTiming(1);
        tx.value = withTiming(0);
        ty.value = withTiming(0);
        runOnJS(onChange)({ scale: 1, tx: 0, ty: 0 });
      } else {
        runOnJS(commit)();
      }
    });

  // 두 번 두드리면 처음 구도로 — 확대하다 길을 잃었을 때 빠져나올 길
  const reset = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withTiming(1);
      tx.value = withTiming(0);
      ty.value = withTiming(0);
      runOnJS(onChange)({ scale: 1, tx: 0, ty: 0 });
    });

  const base = coverScale(photoWidth, photoHeight, width, height);
  const photo = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={Gesture.Simultaneous(reset, pan, pinch)}>
      {/* touchAction: 모바일 브라우저가 핀치를 페이지 줌으로 가로채지 않게 — 웹에서만 의미 있는 속성 */}
      <View
        style={{ width, height, overflow: 'hidden', ...({ touchAction: 'none' } as object) }}
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: (width - photoWidth * base) / 2,
              top: (height - photoHeight * base) / 2,
              width: photoWidth * base,
              height: photoHeight * base,
            },
            photo,
          ]}
        >
          <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="fill" />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

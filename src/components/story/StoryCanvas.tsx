import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector, type GestureType } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { CANVAS_ZOOM_MAX, clampPan, coverScale } from '@/lib/stories';

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
  /** 축소의 바닥 (cover 대비). 여기까지 줄인 구도를 저장할 수 있는지는 부르는 쪽이 안다 */
  minScale: number;
  /** 손을 뗐을 때 확정된 구도 */
  onChange: (t: CanvasTransform) => void;
  /**
   * 이 캔버스의 제스처를 밖에서 가리키기 위한 ref들.
   * 위에 얹히는 텍스트 레이어가 `blocksExternalGesture`로 이걸 막는다 —
   * 둘은 형제 뷰라 RNGH가 알아서 우선순위를 정해 주지 않는다.
   */
  gestureRefs?: {
    pan: React.MutableRefObject<GestureType | undefined>;
    pinch: React.MutableRefObject<GestureType | undefined>;
    reset: React.MutableRefObject<GestureType | undefined>;
  };
};

/**
 * 편집 캔버스의 사진 — 오므려 키우거나 줄이고, 끌어서 구도를 잡는다.
 *
 * **처음 구도는 캔버스를 꽉 채우는 배율(cover=1)이다** — 인스타와 같다. 사진 전체를
 * 보이게 열면(contain) 위아래로 흐린 여백만 큰 화면이 되고, 그 여백을 보려고 연 게 아니다.
 * 원본을 더 보고 싶으면 그 자리에서 오므려 줄인다.
 * 배율의 범위는 `minScale` ~ cover×4다. 1(=cover) 밑으로 내려가면 사진이 캔버스를 다 덮지 못해
 * 뒤가 비치는데, 그건 사고가 아니라 고른 구도다 — 뒤를 무엇으로 채울지는 부르는 쪽이 정한다
 * (편집 화면은 같은 사진의 흐린 배경을 깐다).
 * 팬은 매 프레임 clampPan으로 잘려 사진이 그 여백 쪽으로 새지 않는다.
 */
export function StoryCanvas({
  uri,
  photoWidth,
  photoHeight,
  width,
  height,
  minScale,
  onChange,
  gestureRefs,
}: Props) {
  /** 처음 구도 = 캔버스를 꽉 채우는 배율 */
  const initial = 1;
  const floor = minScale;

  /*
    웹은 브라우저 확대를 열어 두었다(피드 사진을 자세히 보는 수단) — 그래서 두 손가락을
    페이지 줌에 뺏기지 않게 막는 일이 이 캔버스 몫이다. 안 막으면 사진은 그대로고 앱 화면만 커진다.
    아래 View의 `touch-action: none`이 크롬을 막고, iOS 사파리는 그것만으로 부족해
    gesture* 이벤트까지 막는다. 이 캔버스가 떠 있는 동안만. 웹 전용 — 네이티브엔 이 이벤트가 없다
  */
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const stop = (e: Event) => e.preventDefault();
    const types = ['gesturestart', 'gesturechange', 'gestureend'];
    types.forEach((t) => document.addEventListener(t, stop, { passive: false }));
    return () => types.forEach((t) => document.removeEventListener(t, stop));
  }, []);

  const scale = useSharedValue(initial);
  const saved = useSharedValue(initial);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  // 사진을 바꾸면 구도도 처음부터
  useEffect(() => {
    scale.value = initial;
    saved.value = initial;
    tx.value = 0;
    ty.value = 0;
    onChange({ scale: initial, tx: 0, ty: 0 });
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
    .withRef(gestureRefs?.pan ?? { current: undefined })
    .onChange((e) => {
      tx.value += e.changeX;
      ty.value += e.changeY;
      fit();
    })
    .onEnd(() => runOnJS(commit)());

  const pinch = Gesture.Pinch()
    .withRef(gestureRefs?.pinch ?? { current: undefined })
    .onBegin(() => {
      saved.value = scale.value;
    })
    .onChange((e) => {
      scale.value = Math.min(CANVAS_ZOOM_MAX, Math.max(floor, saved.value * e.scale));
      fit();
    })
    .onEnd(() => runOnJS(commit)());

  // 두 번 두드리면 처음 구도로 — 확대하다 길을 잃었을 때 빠져나올 길
  const reset = Gesture.Tap()
    .withRef(gestureRefs?.reset ?? { current: undefined })
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withTiming(initial);
      tx.value = withTiming(0);
      ty.value = withTiming(0);
      runOnJS(onChange)({ scale: initial, tx: 0, ty: 0 });
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

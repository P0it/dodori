import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { type ImageContentFit } from 'expo-image';
import { Photo } from '@/components/Photo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector, type GestureType } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

/** 손을 뗀 뒤 제자리로 돌아가는 시간 */
const SNAP_MS = 180;
const MAX_SCALE = 4;

type Frame = { x: number; y: number; width: number; height: number };
type Target = Frame & { url: string; contentFit: ImageContentFit };

type ZoomCtx = {
  scale: SharedValue<number>;
  tx: SharedValue<number>;
  ty: SharedValue<number>;
  show: (t: Target) => void;
  hide: () => void;
};

const Ctx = createContext<ZoomCtx | null>(null);

/**
 * 핀치 확대 오버레이의 호스트.
 *
 * 사진은 가로 캐러셀(ScrollView) 안에 있어 그 자리에서 키우면 프레임 밖이 잘린다.
 * 그래서 인스타처럼 화면 맨 위에 같은 사진의 복사본을 원래 자리에 겹쳐 띄우고 그것만 키운다
 * (원본은 그대로 둔다 — 복사본이 같은 자리·같은 크기라 가려져서 보이지 않는다).
 */
export function PhotoZoomHost({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const [target, setTarget] = useState<Target | null>(null);

  const show = useCallback((t: Target) => setTarget(t), []);
  const hide = useCallback(() => setTarget(null), []);

  const photoStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));
  // 배경은 배율을 따라 어두워진다 — 확대가 시작된 것을 눈으로 알 수 있게
  const dimStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, (scale.value - 1) / 2) * 0.85,
  }));

  return (
    <Ctx.Provider value={{ scale, tx, ty, show, hide }}>
      {children}
      {target && (
        /* measureInWindow는 화면 좌표 — 이 오버레이는 상태바 아래에서 시작하므로 그만큼 올린다 */
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: -insets.top, left: 0, right: 0, bottom: 0 }}
        >
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, dimStyle]} />
          <Animated.View
            style={[
              { position: 'absolute', left: target.x, top: target.y, width: target.width, height: target.height },
              photoStyle,
            ]}
          >
            <Photo
              url={target.url}
              style={{ width: '100%', height: '100%' }}
              contentFit={target.contentFit}
            />
          </Animated.View>
        </View>
      )}
    </Ctx.Provider>
  );
}

type ZoomableProps = {
  url: string;
  style: StyleProp<ViewStyle>;
  contentFit: ImageContentFit;
  transition?: number;
  /**
   * 함께 동시 인식할 스크롤 제스처들 — 가로 캐러셀·세로 피드 리스트를 Gesture.Native()로 감싼 것.
   * 이걸 넘기지 않으면 핀치가 '가능' 상태로 대기하는 동안 그 위에서 1손가락 스크롤이 막힌다.
   */
  simultaneousGestures?: GestureType[];
};

/**
 * 오므리면 커지는 사진. 손을 떼면 제자리로 돌아온다.
 *
 * 두 손가락일 때만 반응하므로 한 손가락 스와이프(캐러셀 넘기기·세로 스크롤)는 그대로다.
 * 호스트 없이 쓰면 그냥 사진이다 — 확대가 필요 없는 화면에서도 같은 컴포넌트를 쓸 수 있다.
 */
export function ZoomableImage({ url, style, contentFit, transition, simultaneousGestures }: ZoomableProps) {
  const zoom = useContext(Ctx);
  const ref = useRef<View>(null);
  // 손가락 중심의 출발점 — 여기서 얼마나 움직였는지가 곧 사진이 따라갈 거리다
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);

  const begin = useCallback(() => {
    ref.current?.measureInWindow((x, y, width, height) => {
      zoom?.show({ x, y, width, height, url, contentFit });
    });
  }, [zoom, url, contentFit]);

  const end = useCallback(() => zoom?.hide(), [zoom]);

  const pinch = Gesture.Pinch()
    .onStart((e) => {
      if (!zoom) return;
      zoom.scale.value = 1;
      zoom.tx.value = 0;
      zoom.ty.value = 0;
      originX.value = e.focalX;
      originY.value = e.focalY;
      runOnJS(begin)();
    })
    .onUpdate((e) => {
      if (!zoom) return;
      // 1 밑으로는 줄이지 않는다 — 원본보다 작아지면 겹쳐 둔 복사본 뒤가 비친다
      zoom.scale.value = Math.min(MAX_SCALE, Math.max(1, e.scale));
      zoom.tx.value = e.focalX - originX.value;
      zoom.ty.value = e.focalY - originY.value;
    })
    .onEnd(() => {
      if (!zoom) return;
      zoom.tx.value = withTiming(0, { duration: SNAP_MS });
      zoom.ty.value = withTiming(0, { duration: SNAP_MS });
      zoom.scale.value = withTiming(1, { duration: SNAP_MS }, (done) => {
        if (done) runOnJS(end)();
      });
    });

  const gesture = simultaneousGestures?.length
    ? pinch.simultaneousWithExternalGesture(...simultaneousGestures)
    : pinch;

  return (
    <GestureDetector gesture={gesture}>
      <View ref={ref} collapsable={false} style={style}>
        <Photo
          url={url}
          style={{ width: '100%', height: '100%' }}
          contentFit={contentFit}
          transition={transition}
        />
      </View>
    </GestureDetector>
  );
}

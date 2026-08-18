import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
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
  /*
    iOS 사파리는 `user-scalable=no`를 무시하고 두 손가락을 페이지 줌(gesture* 이벤트)으로
    가져간다 — 그러면 사진은 그대로고 앱 화면만 커진다. 확대를 우리가 그리는 동안만 막는다.
    (StoryCanvas와 같은 처방 — 웹 전용, 네이티브엔 이 이벤트가 없다)
  */
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const stop = (e: Event) => e.preventDefault();
    const types = ['gesturestart', 'gesturechange', 'gestureend'];
    types.forEach((t) => document.addEventListener(t, stop, { passive: false }));
    return () => types.forEach((t) => document.removeEventListener(t, stop));
  }, []);
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
          style={{
            position: 'absolute',
            // 웹의 좌표는 이미 뷰포트 기준이라 보정하지 않는다
            top: Platform.OS === 'web' ? 0 : -insets.top,
            left: 0,
            right: 0,
            bottom: 0,
          }}
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
 *
 * 웹과 네이티브는 손가락을 듣는 방법이 다르다 — 웹은 RNGH를 쓸 수 없어(감싸는 순간
 * `touch-action: none`이 걸려 그 영역 스크롤이 죽는다) DOM 터치 이벤트로 직접 듣는다.
 * 확대해서 그리는 부분(위 호스트)은 둘이 공유한다.
 */
export function ZoomableImage(props: ZoomableProps) {
  if (Platform.OS === 'web') return <WebZoomableImage {...props} />;
  return <NativeZoomableImage {...props} />;
}

const gap = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
const midX = (t: TouchList) => (t[0].clientX + t[1].clientX) / 2;
const midY = (t: TouchList) => (t[0].clientY + t[1].clientY) / 2;

/**
 * 웹의 확대 — DOM 터치 이벤트로 직접 듣는다.
 *
 * RNGH(GestureDetector)를 쓰면 감싼 요소에 `touch-action: none`이 걸려 그 영역의 스크롤이
 * 통째로 죽는다. 그래서 여기서는 `touch-action: pan-x pan-y`로 **한 손가락은 브라우저에**
 * (세로 피드·가로 캐러셀 그대로) 넘기고, **두 손가락만** 우리가 가져간다.
 * 브라우저 페이지 줌은 이 값으로 이미 꺼진다 — 페이지가 통째로 확대되면 고정된 탭바와
 * 안쪽 스크롤이 싸워 화면이 흔들렸다.
 */
function WebZoomableImage({ url, style, contentFit, transition }: ZoomableProps) {
  const zoom = useContext(Ctx);
  const ref = useRef<View>(null);

  useEffect(() => {
    // RN Web에서 View의 ref는 DOM 요소다. 리스너를 직접 달아야 preventDefault를 쓸 수 있다
    // (React가 붙이는 touchmove는 passive라 막을 수 없다)
    const el = ref.current as unknown as HTMLElement | null;
    if (!el || !zoom) return;

    let base = 0;
    let originX = 0;
    let originY = 0;
    let snap: ReturnType<typeof setTimeout> | null = null;

    const start = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      if (snap) clearTimeout(snap);
      base = gap(e.touches);
      originX = midX(e.touches);
      originY = midY(e.touches);
      zoom.scale.value = 1;
      zoom.tx.value = 0;
      zoom.ty.value = 0;
      const r = el.getBoundingClientRect();
      zoom.show({ x: r.left, y: r.top, width: r.width, height: r.height, url, contentFit });
    };

    const move = (e: TouchEvent) => {
      if (!base || e.touches.length !== 2) return;
      e.preventDefault();
      // 1 밑으로는 줄이지 않는다 — 원본보다 작아지면 겹쳐 둔 복사본 뒤가 비친다
      zoom.scale.value = Math.min(MAX_SCALE, Math.max(1, gap(e.touches) / base));
      zoom.tx.value = midX(e.touches) - originX;
      zoom.ty.value = midY(e.touches) - originY;
    };

    const end = (e: TouchEvent) => {
      if (!base || e.touches.length >= 2) return;
      base = 0;
      zoom.tx.value = withTiming(0, { duration: SNAP_MS });
      zoom.ty.value = withTiming(0, { duration: SNAP_MS });
      zoom.scale.value = withTiming(1, { duration: SNAP_MS });
      snap = setTimeout(() => zoom.hide(), SNAP_MS);
    };

    el.addEventListener('touchstart', start, { passive: false });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', end);
    el.addEventListener('touchcancel', end);
    return () => {
      if (snap) clearTimeout(snap);
      el.removeEventListener('touchstart', start);
      el.removeEventListener('touchmove', move);
      el.removeEventListener('touchend', end);
      el.removeEventListener('touchcancel', end);
    };
  }, [zoom, url, contentFit]);

  return (
    <View ref={ref} style={[style, { touchAction: 'pan-x pan-y' } as object]}>
      <Photo url={url} style={{ width: '100%', height: '100%' }} contentFit={contentFit} transition={transition} />
    </View>
  );
}

function NativeZoomableImage({ url, style, contentFit, transition, simultaneousGestures }: ZoomableProps) {
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

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { color, typeface } from '@/theme/tokens';
import { DodoriMark, MARK_LOWER_DOT } from './DodoriMark';

type Props = { onDone: () => void };

/** 마지막 글자는 점 없는 i(U+0131) — 그 점은 마크에서 떨어져 나와 앉는다 */
const LETTERS = ['d', 'o', 'd', 'o', 'r', 'ı'] as const;

const MARK_SIZE = 64;
const MARK_DOT_D = MARK_SIZE * MARK_LOWER_DOT.d;

const FONT_SIZE = 36;
const LINE_HEIGHT = 44;
/** i 점의 지름·중심 y(글자 상단 기준) — 실제 i 점보다 굵다. 굴러온 공이라는 게 읽혀야 한다 */
const DOT_SIZE = 10;
const DOT_CY = 12;

/** 마크에서 제자리 수직 낙하 */
const DROP_DURATION = 300;
/** 착지 후 오른쪽 글자를 하나씩 밟아 i까지. 남은 글자 수만큼 앞에서 잘라 쓴다 (마지막 홉이 늘 제일 작다) */
const HOP_HEIGHTS = [34, 20, 14, 10, 7, 5];
const HOP_DURATIONS = [380, 320, 280, 250, 220, 200];
/** 안착하면서 브랜드 그린 → 흰색 */
const SETTLE_DURATION = 250;

type Box = { x: number; y: number };

/**
 * 인앱 스플래시 — 네이티브 스플래시(마크만)를 이어받아 워드마크를 띄우고 사라진다.
 * 마크는 네이티브와 같은 화면 정중앙에 두고 워드마크만 절대배치 → 전환 시 마크가 튀지 않는다.
 *
 * 마크(𝄆)의 아래 점을 떼어내 워드마크 dodori의 i 점으로 굴려 보낸다. 마크는 그 점을 비운 채
 * 그리고(hideLowerDot), 같은 자리에 겹쳐 둔 애니메이션 View가 처음부터 그 점 노릇을 한다 —
 * 떨어져 나가는 순간에 아무것도 바뀌지 않아 이음매가 안 보인다.
 *
 * 좌표는 전부 실측이다. 마크 박스·워드마크 줄·글자 6개를 onLayout으로 재서 착지점을 만든다.
 * 하드코딩이 없으니 기기·폰트에 따라 글자폭이 달라져도 어긋나지 않는다.
 */
export function BrandSplash({ onDone }: Props) {
  const word = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const dotX = useRef(new Animated.Value(0)).current;
  const dotY = useRef(new Animated.Value(0)).current;
  const dotScale = useRef(new Animated.Value(1)).current;
  /** 0=브랜드 그린(마크의 점) → 1=흰색(워드마크의 점). 색은 네이티브 드라이버가 못 굴린다 */
  const settle = useRef(new Animated.Value(0)).current;

  const letters = useRef<number[]>([]);
  const [mark, setMark] = useState<Box | null>(null);
  const [row, setRow] = useState<Box | null>(null);
  const [centers, setCenters] = useState<number[] | null>(null);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  // 점이 그려지기 전에 시작 좌표가 박혀 있어야 한다 (useEffect면 한 프레임 (0,0)에 번쩍인다)
  useLayoutEffect(() => {
    if (!mark || !row || !centers) return;

    // 시작점 = 마크의 아래 점 자리 (겹쳐 있으므로 티가 안 난다)
    const from = {
      x: mark.x + MARK_SIZE * MARK_LOWER_DOT.cx,
      y: mark.y + MARK_SIZE * MARK_LOWER_DOT.cy,
    };
    // 바닥 = i 점이 앉을 높이. 글자 위 이 수평선을 튄다
    const floor = row.y + DOT_CY;
    const stops = centers.map((cx) => row.x + cx);
    // 제자리에 떨어지므로 착지점 오른쪽에 남은 글자만 밟는다. 마크 점이 i보다 오른쪽일 리는 없지만
    // 그래도 비면 i로 한 번에 간다
    const remaining = stops.filter((x) => x > from.x);
    const hops = remaining.length > 0 ? remaining : [stops[stops.length - 1]];

    dotX.setValue(from.x);
    dotY.setValue(from.y);
    dotScale.setValue(1);
    settle.setValue(0);

    const arc = (toX: number, height: number, duration: number, scaleTo?: number) =>
      Animated.parallel([
        Animated.timing(dotX, {
          toValue: toX,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(dotY, {
            toValue: floor - height,
            duration: duration / 2,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(dotY, {
            toValue: floor,
            duration: duration / 2,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        ...(scaleTo === undefined
          ? []
          : [
              Animated.timing(dotScale, {
                toValue: scaleTo,
                duration,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
            ]),
      ]);

    Animated.sequence([
      Animated.delay(100),
      Animated.timing(word, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // 마크에서 이탈 — 제자리에서 수직으로 떨어지며 마크 점 크기에서 굴러다닐 크기로 줄어든다
      Animated.parallel([
        Animated.timing(dotY, {
          toValue: floor,
          duration: DROP_DURATION,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(dotScale, {
          toValue: DOT_SIZE / MARK_DOT_D,
          duration: DROP_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      ...hops.map((x, i) => arc(x, HOP_HEIGHTS[i], HOP_DURATIONS[i])),
      // 안착 — 그린에서 흰색으로 (여기서 워드마크가 하나로 완성된다)
      Animated.timing(settle, {
        toValue: 1,
        duration: SETTLE_DURATION,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.delay(800),
      Animated.timing(fade, {
        toValue: 0,
        duration: 450,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onDone();
    });
  }, [mark, row, centers, word, fade, dotX, dotY, dotScale, settle, onDone]);

  // 실측이 끝나기 전에는 마크가 자기 점을 그대로 그린다 — 교대하는 순간 좌표가 같아 이음매가 없다
  const ready = mark !== null && row !== null && centers !== null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: color.bg, alignItems: 'center', justifyContent: 'center', opacity: fade },
      ]}
    >
      <View onLayout={(e) => setMark(e.nativeEvent.layout)}>
        <DodoriMark size={MARK_SIZE} hideLowerDot={ready} />
      </View>

      <Animated.View
        onLayout={(e) => setRow(e.nativeEvent.layout)}
        style={{
          position: 'absolute',
          top: '50%',
          marginTop: 52,
          flexDirection: 'row',
          opacity: word,
          transform: [{ translateY: word.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        }}
      >
        {LETTERS.map((ch, i) => (
          <Text
            key={i}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              letters.current[i] = x + width / 2;
              if (letters.current.length === LETTERS.length && !letters.current.includes(undefined!)) {
                setCenters([...letters.current]);
              }
            }}
            style={{
              fontFamily: typeface,
              fontWeight: '800',
              fontSize: FONT_SIZE,
              lineHeight: LINE_HEIGHT,
              letterSpacing: -1,
              color: color.white,
            }}
          >
            {ch}
          </Text>
        ))}
      </Animated.View>

      {/* 떼어낸 마크의 아래 점 — 화면 좌표계에서 마크와 워드마크 사이를 오간다 */}
      {ready && (
        // 이동은 네이티브 드라이버(바깥), 색은 JS 드라이버(안쪽) — 한 View에 섞으면 RN이 거부한다
        <Animated.View
          style={{
            position: 'absolute',
            top: -MARK_DOT_D / 2,
            left: -MARK_DOT_D / 2,
            width: MARK_DOT_D,
            height: MARK_DOT_D,
            transform: [{ translateX: dotX }, { translateY: dotY }, { scale: dotScale }],
          }}
        >
          <Animated.View
            style={{
              width: '100%',
              height: '100%',
              borderRadius: MARK_DOT_D / 2,
              backgroundColor: settle.interpolate({
                inputRange: [0, 1],
                outputRange: [color.accent, color.white],
              }),
            }}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}

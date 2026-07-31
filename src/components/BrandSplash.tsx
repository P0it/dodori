import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { color, typeface } from '@/theme/tokens';
import { DodoriMark } from './DodoriMark';

type Props = { onDone: () => void };

/** 마지막 글자는 점 없는 i(U+0131) — 그 점은 따로 날아와 앉는다 */
const LETTERS = ['d', 'o', 'd', 'o', 'r', 'ı'] as const;

const FONT_SIZE = 36;
const LINE_HEIGHT = 44;
/** 점 지름·중심 y — Pretendard ExtraBold 36px의 실제 i 점에 맞춘 눈대중 값 */
const DOT_SIZE = 5;
const DOT_CY = 12;
/** 점이 떨어지기 시작하는 높이 */
const DROP_FROM = -140;

/** d→o→d→o→r→i 다섯 번, 점점 낮고 빠르게 */
const HOPS = [
  { height: 30, duration: 190 },
  { height: 22, duration: 170 },
  { height: 15, duration: 155 },
  { height: 10, duration: 140 },
  { height: 6, duration: 125 },
];

/**
 * 인앱 스플래시 — 네이티브 스플래시(마크만)를 이어받아 워드마크를 띄우고 사라진다.
 * 마크는 네이티브와 같은 화면 정중앙에 두고 워드마크만 절대배치 → 전환 시 마크가 튀지 않는다.
 *
 * 워드마크는 글자별로 쪼개 렌더하고 onLayout으로 각 글자의 중심 x를 잰다. 점의 착지 좌표를
 * 하드코딩하지 않으니 기기·폰트에 따라 글자폭이 달라져도 어긋나지 않는다.
 */
export function BrandSplash({ onDone }: Props) {
  const word = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const dotX = useRef(new Animated.Value(0)).current;
  const dotY = useRef(new Animated.Value(DROP_FROM)).current;
  const dotOn = useRef(new Animated.Value(0)).current;

  const measured = useRef<number[]>([]);
  const [centers, setCenters] = useState<number[] | null>(null);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (!centers) return;
    dotX.setValue(centers[0]);
    dotY.setValue(DROP_FROM);

    const hops = HOPS.map(({ height, duration }, i) =>
      Animated.parallel([
        Animated.timing(dotX, {
          toValue: centers[i + 1],
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(dotY, {
            toValue: DOT_CY - height,
            duration: duration / 2,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(dotY, {
            toValue: DOT_CY,
            duration: duration / 2,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    Animated.sequence([
      Animated.delay(100),
      Animated.timing(word, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // 낙하 — 가속해서 첫 글자 위에 떨어진다. 그 전까지 점은 숨겨둔다
      Animated.timing(dotOn, {
        toValue: 1,
        duration: 1,
        useNativeDriver: true,
      }),
      Animated.timing(dotY, {
        toValue: DOT_CY,
        duration: 220,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      ...hops,
      Animated.delay(280),
      Animated.timing(fade, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onDone();
    });
  }, [centers, word, fade, dotX, dotY, dotOn, onDone]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: color.bg, alignItems: 'center', justifyContent: 'center', opacity: fade },
      ]}
    >
      <DodoriMark size={64} />
      <Animated.View
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
              measured.current[i] = x + width / 2;
              if (measured.current.length === LETTERS.length && !measured.current.includes(undefined!)) {
                setCenters([...measured.current]);
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
        <Animated.View
          style={{
            position: 'absolute',
            top: -DOT_SIZE / 2,
            left: -DOT_SIZE / 2,
            width: DOT_SIZE,
            height: DOT_SIZE,
            borderRadius: DOT_SIZE / 2,
            backgroundColor: color.accent,
            opacity: dotOn,
            transform: [{ translateX: dotX }, { translateY: dotY }],
          }}
        />
      </Animated.View>
    </Animated.View>
  );
}

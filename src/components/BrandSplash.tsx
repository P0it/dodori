import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { color, typeface } from '@/theme/tokens';
import { DodoriMark } from './DodoriMark';

type Props = { onDone: () => void };

/**
 * 인앱 스플래시 — 네이티브 스플래시(마크만)를 이어받아 워드마크를 띄우고 사라진다.
 * 마크는 네이티브와 같은 화면 정중앙에 두고 워드마크만 절대배치 → 전환 시 마크가 튀지 않는다.
 */
export function BrandSplash({ onDone }: Props) {
  const word = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    SplashScreen.hideAsync();
    Animated.sequence([
      Animated.delay(140),
      Animated.timing(word, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.delay(620),
      Animated.timing(fade, {
        toValue: 0,
        duration: 340,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onDone();
    });
  }, [word, fade, onDone]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: color.bg, alignItems: 'center', justifyContent: 'center', opacity: fade },
      ]}
    >
      <DodoriMark size={64} />
      <View style={{ position: 'absolute', top: '50%', marginTop: 52 }}>
        <Animated.Text
          style={{
            fontFamily: typeface,
            fontWeight: '800',
            fontSize: 40,
            letterSpacing: -0.5,
            color: color.white,
            opacity: word,
            transform: [
              { translateY: word.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
            ],
          }}
        >
          dodori
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { color } from '@/theme/tokens';
import { CalGlyph, FeedGlyph, HomeGlyph, LibGlyph } from '@/components/glyphs';

const TABS = [
  { name: 'home', label: '홈', Glyph: HomeGlyph },
  { name: 'calendar', label: '캘린더', Glyph: CalGlyph },
  { name: 'playlist', label: '라이브러리', Glyph: LibGlyph },
  { name: 'feed', label: '피드', Glyph: FeedGlyph },
] as const;

/** expo-router가 넘기는 tabBar props의 구조적 최소 타입 (라이브러리 간 타입 충돌 회피) */
type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void };
};

/** 3탭 하단 네비 — expo-router Tabs의 custom tabBar */
export function CoupleTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={['rgba(13,13,13,0)', '#0d0d0d']}
      locations={[0, 0.45]}
      /*
        웹은 인라인 padding을 주지 않는다 — index.html의 `[data-safe-bottom]`이 CSS
        env(safe-area-inset-bottom)로 직접 그린다. useSafeAreaInsets는 웹에서 마운트 시점에 한 번,
        그리고 값이 바뀔 때 transitionend가 올 때만 갱신돼서(react-native-safe-area-context의
        NativeSafeAreaProvider.web) 사파리 주소창이 접히고 펴질 때 옛 값이 그대로 남는다 —
        탭바 아래 여백이 생겼다 없어졌다 하던 원인. 인라인 스타일은 CSS를 이기므로 비워야 한다.
      */
      {...(Platform.OS === 'web'
        ? { dataSet: { safeBottom: '' } }
        : { style: { paddingBottom: Math.max(insets.bottom, 12) } })}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'flex-start',
          paddingTop: 10,
        }}
      >
        {TABS.map((tab) => {
          const routeIndex = state.routes.findIndex((r: { name: string }) => r.name === tab.name);
          const on = state.index === routeIndex;
          const fg = on ? color.white : color.sub;
          return (
            <Pressable
              key={tab.name}
              onPress={() => {
                if (routeIndex >= 0 && !on) navigation.navigate(state.routes[routeIndex].name);
              }}
              style={{ alignItems: 'center', gap: 5, minWidth: 72 }}
            >
              <tab.Glyph size={23} filled={on} color={fg} />
              <Text
                style={{
                  fontWeight: on ? '700' : '500',
                  fontSize: 9.5,
                  letterSpacing: -0.1,
                  color: fg,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </LinearGradient>
  );
}

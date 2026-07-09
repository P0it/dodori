import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { color } from '@/theme/tokens';
import { formatDday } from '@/lib/date';
import { pickNextUp, nextUpProgress } from '@/lib/nextup';
import { useAllTracks } from '@/api/tracks';
import { useAnniversaries } from '@/api/anniversaries';
import { CalGlyph, DiscGlyph, LibGlyph } from '@/components/glyphs';
import { NextUp, type NextUpItem } from '@/components/NextUp';

const TABS = [
  { name: 'playlist', label: '플레이리스트', Glyph: LibGlyph },
  { name: 'calendar', label: '캘린더', Glyph: CalGlyph },
  { name: 'studio', label: '스튜디오', Glyph: DiscGlyph },
] as const;

/** expo-router가 넘기는 tabBar props의 구조적 최소 타입 (라이브러리 간 타입 충돌 회피) */
type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void };
};

/**
 * 3탭 하단 네비 + NextUp 도킹 크롬 (목업 AppChrome = NextUp + CoupleTabs)
 * expo-router Tabs의 custom tabBar로 사용.
 */
export function CoupleTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tracks = useAllTracks();
  const annivs = useAnniversaries();

  // "다음 일정" (§7.6) — upcoming track 최근접 1건 → 다음 기념일
  const pick = useMemo(
    () => pickNextUp(tracks.data ?? [], annivs.data ?? []),
    [tracks.data, annivs.data],
  );
  const coverUrl =
    pick?.kind === 'track'
      ? (tracks.data?.find((t) => t.id === pick.id)?.coverThumbUrl ?? undefined)
      : undefined;
  const nextUp: NextUpItem | null = pick
    ? {
        kind: pick.kind,
        title: pick.kind === 'track' ? pick.title : pick.label,
        subtitle: `${pick.date.slice(5).replace('-', '.')} · ${formatDday(pick.date)}`,
        coverUrl,
        progress: nextUpProgress(pick.date),
      }
    : null;

  return (
    <LinearGradient
      colors={['rgba(13,13,13,0)', '#0d0d0d']}
      locations={[0, 0.45]}
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
      {nextUp && (
        <NextUp
          item={nextUp}
          onPress={() =>
            pick?.kind === 'track'
              ? router.push(`/track/${pick.id}`)
              : router.push('/(tabs)/playlist/queue')
          }
        />
      )}
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

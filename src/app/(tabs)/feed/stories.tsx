import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { color, space, typeface } from '@/theme/tokens';
import { formatMonthLabel, groupByMonth } from '@/lib/stories';
import { useStories } from '@/api/stories';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';
import { StoryCard } from '@/components/story/StoryCard';

/** 스토리 보관함 — 24시간이 지나도 지우지 않으니 여기가 곧 아카이브다 */
export default function StoryArchive() {
  const router = useRouter();
  const stories = useStories();
  const months = groupByMonth(stories.data ?? []);

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar title="스토리" />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={stories.isRefetching}
            onRefresh={stories.refetch}
            tintColor={color.sub}
            colors={[color.accent]}
          />
        }
      >
        {months.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 40, paddingHorizontal: 24 }}>
            <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 16, color: color.white }}>
              아직 스토리가 없어요
            </Text>
            <Meta style={{ marginTop: 7, textAlign: 'center' }}>
              홈 위쪽 링에서 오늘 한 컷을 던져보세요.
            </Meta>
          </View>
        ) : (
          months.map((m) => (
            <View key={m.key} style={{ marginTop: space[4] }}>
              <Text
                style={{
                  fontFamily: typeface,
                  fontWeight: '700',
                  fontSize: 14,
                  color: color.sub,
                  paddingHorizontal: 8,
                  paddingBottom: 8,
                }}
              >
                {formatMonthLabel(m.key)}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {m.stories.map((s) => (
                  <View key={s.id} style={{ width: '33.333%' }}>
                    <StoryCard
                      thumbUrl={s.photo?.gridThumbUrl ?? null}
                      caption={s.caption}
                      trackTitle={s.trackTitle}
                      onPress={() => router.push(`/story/${s.id}`)}
                    />
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

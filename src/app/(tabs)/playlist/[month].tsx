import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { color, role, typeface } from '@/theme/tokens';
import { isReleased, monthKey } from '@/lib/date';
import { useAllTracks } from '@/api/tracks';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';

/** 월 플레이리스트 상세 (목업 08) — 실체 테이블 없이 tracks 월 그룹 (§5) */
export default function MonthDetail() {
  const { month } = useLocalSearchParams<{ month: string }>();
  const router = useRouter();
  const tracks = useAllTracks();
  const list = (tracks.data ?? [])
    .filter((t) => monthKey(t.date) === month)
    .sort((a, b) => a.date.localeCompare(b.date));
  const photoTotal = list.reduce((n, t) => n + t.photoCount, 0);
  const covers = list.filter((t) => t.coverThumbUrl).slice(0, 4);
  const title = month ? `${month.slice(0, 4)}년 ${Number(month.slice(5))}월` : '';

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar title={title} />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* 콜라주 커버 (§6.4) */}
        <View style={{ alignItems: 'center', paddingTop: 8 }}>
          <View
            style={{
              width: 176,
              height: 176,
              borderRadius: 6,
              overflow: 'hidden',
              flexDirection: 'row',
              flexWrap: 'wrap',
              backgroundColor: color.surface2,
            }}
          >
            {[0, 1, 2, 3].map((i) =>
              covers[i] ? (
                <Image
                  key={i}
                  source={covers[i].coverThumbUrl!}
                  style={{ width: '50%', height: '50%' }}
                  contentFit="cover"
                />
              ) : (
                <View key={i} style={{ width: '50%', height: '50%', backgroundColor: color.surface2 }} />
              ),
            )}
          </View>
          <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 24, color: color.white, marginTop: 16, letterSpacing: -0.4 }}>
            {title}
          </Text>
          <Meta style={{ marginTop: 6 }}>
            플레이리스트 · {list.length} 데이트 · 사진 {photoTotal}
          </Meta>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          {list.map((t) => {
            const upcoming = !isReleased(t.date);
            return (
              <Pressable
                key={t.id}
                onPress={() => router.push(`/track/${t.id}`)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    overflow: 'hidden',
                    backgroundColor: color.surface2,
                    borderWidth: upcoming ? 1.5 : 0,
                    borderStyle: 'dashed',
                    borderColor: role.me,
                  }}
                >
                  {t.coverThumbUrl && (
                    <Image source={t.coverThumbUrl} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  )}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <Text numberOfLines={1} style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15.5, color: color.white }}>
                      {t.title}
                    </Text>
                    {upcoming && (
                      <Text
                        style={{
                          fontSize: 10,
                          fontFamily: typeface, fontWeight: '700',
                          color: role.me,
                          borderWidth: 1,
                          borderColor: role.me,
                          borderRadius: 4,
                          paddingHorizontal: 5,
                          paddingVertical: 1,
                        }}
                      >
                        예정
                      </Text>
                    )}
                  </View>
                  <Meta style={{ marginTop: 3, fontSize: 12.5 }}>
                    {t.date.slice(5).replace('-', '.')} · 사진 {t.photoCount}
                    {t.noteCount ? ` · 노트 ${t.noteCount}` : ''}
                    {upcoming && t.placeCount ? ` · 코스 ${t.placeCount}곳` : ''}
                  </Meta>
                </View>
                <Text style={{ fontFamily: typeface, color: color.muted }}>›</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { color, role, typeface } from '@/theme/tokens';
import { formatDday, isReleased, todayKST } from '@/lib/date';
import { useAllTracks } from '@/api/tracks';
import { useAnniversaries } from '@/api/anniversaries';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';
import { Eyebrow } from '@/components/Eyebrow';
import { Divider } from '@/components/Divider';
import { Dday } from '@/components/Dday';
import { AnnivCover } from '@/components/AnnivCover';

/** Queue — 다가오는 데이트·기념일 (목업 10) */
export default function Queue() {
  const router = useRouter();
  const tracks = useAllTracks();
  const annivs = useAnniversaries();
  const today = todayKST();

  const upcoming = useMemo(
    () =>
      (tracks.data ?? [])
        .filter((t) => !isReleased(t.date))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [tracks.data],
  );
  const upcomingAnnivs = useMemo(
    () =>
      (annivs.data ?? [])
        .filter((a) => a.nextDate >= today)
        .sort((a, b) => a.nextDate.localeCompare(b.nextDate)),
    [annivs.data, today],
  );

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar title="다음 순서" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 4 }}>
          <Eyebrow>다가오는 데이트 · 기념일</Eyebrow>
          <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 22, color: color.white, marginTop: 6 }}>
            Queue
          </Text>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <Eyebrow color={role.me} style={{ marginBottom: 4 }}>
            지금 다음
          </Eyebrow>
          {upcoming.length === 0 ? (
            <Meta style={{ paddingVertical: 10 }}>예정된 데이트가 없어요</Meta>
          ) : (
            upcoming.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => router.push(`/track/${t.id}`)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 }}
              >
                <View style={{ width: 50, height: 50, borderRadius: 8, overflow: 'hidden', backgroundColor: color.surface2 }}>
                  {t.coverThumbUrl && (
                    <Image source={t.coverThumbUrl} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.white }}>{t.title}</Text>
                  <Meta style={{ marginTop: 2, fontSize: 12.5 }}>
                    {t.date.slice(5).replace('-', '.')}
                    {t.placeCount ? ` · 코스 ${t.placeCount}곳` : ''}
                  </Meta>
                </View>
                <Dday>{formatDday(t.date)}</Dday>
              </Pressable>
            ))
          )}

          <Divider style={{ marginVertical: 6 }} />
          <Eyebrow style={{ marginTop: 10, marginBottom: 4 }}>이어서</Eyebrow>
          {upcomingAnnivs.map((a) => (
            <View
              key={a.id}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 }}
            >
              <AnnivCover
                size={50}
                big={a.label.replace(/[^0-9]/g, '') || a.label.slice(0, 1)}
                small={/일$/.test(a.label) && /\d/.test(a.label) ? '일' : undefined}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.white }}>{a.label}</Text>
                <Meta style={{ marginTop: 2, fontSize: 12.5 }}>
                  {a.nextDate.slice(5).replace('-', '.')} · 기념일
                </Meta>
              </View>
              <Dday tone="anniv">{formatDday(a.nextDate)}</Dday>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

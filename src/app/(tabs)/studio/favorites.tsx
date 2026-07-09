import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { color, role } from '@/theme/tokens';
import { useAllTracks } from '@/api/tracks';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';

/** Favorites — liked=true 트랙 (실체 테이블 없음 §5) */
export default function Favorites() {
  const router = useRouter();
  const tracks = useAllTracks();
  const list = (tracks.data ?? []).filter((t) => t.liked);

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar title="Favorites" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        <Meta style={{ paddingVertical: 6 }}>아껴둔 데이트 {list.length}</Meta>
        {list.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => router.push(`/track/${t.id}`)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 }}
          >
            <View style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', backgroundColor: color.surface2 }}>
              {t.coverThumbUrl && (
                <Image source={t.coverThumbUrl} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', fontSize: 15, color: color.white }}>{t.title}</Text>
              <Meta style={{ marginTop: 2, fontSize: 12.5 }}>
                {t.date.replaceAll('-', '.')} · 사진 {t.photoCount}
              </Meta>
            </View>
            <Text style={{ color: role.me, fontSize: 16 }}>♥</Text>
          </Pressable>
        ))}
        {list.length === 0 && (
          <Meta style={{ paddingVertical: 12 }}>
            트랙 상세에서 ♥를 누르면 여기에 모여요
          </Meta>
        )}
      </ScrollView>
    </View>
  );
}

import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { color, typeface } from '@/theme/tokens';
import { formatDday, isReleased } from '@/lib/date';
import { naverMapUrl } from '@/lib/map';
import { linkKind, linkLabel } from '@/lib/link';
import { LinkKindGlyph, NaverMapGlyph } from '@/components/glyphs';
import { usePlaceDetail } from '@/api/playlists';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';
import { Eyebrow } from '@/components/Eyebrow';

/** 장소 상세 — 우리 데이터만 (목업 P2) */
export default function PlaceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const detail = usePlaceDetail(id);
  const p = detail.data;

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      {/* 히어로 */}
      <View style={{ height: 200 }}>
        {p?.photoThumbs[0] ? (
          <Image source={p.photoThumbs[0]} style={{ position: 'absolute', width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: color.surface1 }} />
        )}
        <View
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.35)',
          }}
        />
        <TopBar title="" />
        <View style={{ position: 'absolute', left: 20, right: 20, bottom: 12 }}>
          <Eyebrow style={{ color: 'rgba(255,255,255,0.85)' }}>{p?.category ?? '장소'}</Eyebrow>
          <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 26, color: color.white, marginTop: 4, letterSpacing: -0.4 }}>
            {p?.name}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 10 }}>
          {p ? (
            <Pressable
              onPress={() => Linking.openURL(naverMapUrl(p))}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 7,
                height: 34,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: color.surface2,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <NaverMapGlyph />
              <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 13, color: color.white }}>
                네이버 지도에서 보기
              </Text>
            </Pressable>
          ) : null}
          {p?.link ? (
            <Pressable
              onPress={() => Linking.openURL(p.link!)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 7,
                height: 34,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: color.surface2,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <LinkKindGlyph kind={linkKind(p.link)} />
              <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 13, color: color.sub }}>
                {linkLabel(p.link)}
              </Text>
            </Pressable>
          ) : null}
        </View>
        {p?.address ? (
          <Meta style={{ paddingHorizontal: 20, paddingTop: 10, fontSize: 12.5 }}>{p.address}</Meta>
        ) : null}

        {/* 우리 사진 */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 17, color: color.white }}>
              우리 사진 <Text style={{ color: color.sub, fontFamily: typeface, fontWeight: '500' }}>{p?.photoThumbs.length ?? 0}</Text>
            </Text>
            <Meta style={{ fontSize: 12 }}>이 장소의 데이트에서 자동 연결</Meta>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {(p?.photoThumbs ?? []).map((u, i) => (
              <Image key={i} source={u} style={{ width: '32%', aspectRatio: 1, borderRadius: 4 }} contentFit="cover" />
            ))}
            {(p?.photoThumbs.length ?? 0) === 0 && <Meta>아직 이 장소의 사진이 없어요</Meta>}
          </View>
        </View>

        {/* 여기서 만든 데이트 */}
        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 17, color: color.white }}>
            여기서 만든 데이트{' '}
            <Text style={{ color: color.sub, fontFamily: typeface, fontWeight: '500' }}>{p?.tracks.length ?? 0}</Text>
          </Text>
          {(p?.tracks ?? []).map((t) => {
            const upcoming = !isReleased(t.date);
            return (
              <Pressable
                key={t.id}
                onPress={() => router.push(`/track/${t.id}`)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 }}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.white }}>{t.title}</Text>
                    {upcoming && (
                      <Text
                        style={{
                          fontSize: 10,
                          fontFamily: typeface, fontWeight: '700',
                          color: color.accent,
                          borderWidth: 1,
                          borderColor: color.accent,
                          borderRadius: 4,
                          paddingHorizontal: 5,
                          paddingVertical: 1,
                        }}
                      >
                        예정
                      </Text>
                    )}
                  </View>
                  <Meta style={{ marginTop: 2, fontSize: 12.5 }}>
                    {t.date.replaceAll('-', '.')}
                    {upcoming ? ` · ${formatDday(t.date)}` : ''}
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

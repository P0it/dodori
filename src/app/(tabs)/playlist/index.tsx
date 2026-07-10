import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { color, role, typeface } from '@/theme/tokens';
import { daysSince, formatDday, isReleased, monthKey, todayKST } from '@/lib/date';
import { useAllTracks, type TrackListItem } from '@/api/tracks';
import { useAnniversaries } from '@/api/anniversaries';
import { useMyCouple, useCoupleProfiles } from '@/api/couple';
import { usePlaylists } from '@/api/playlists';
import { Meta } from '@/components/Meta';
import { Eyebrow } from '@/components/Eyebrow';
import { Dday } from '@/components/Dday';
import { AnnivCover } from '@/components/AnnivCover';
import { StarGlyph } from '@/components/glyphs';

/** 플레이리스트 탭 루트 (목업 07) */
export default function PlaylistRoot() {
  const router = useRouter();
  const couple = useMyCouple();
  const profiles = useCoupleProfiles();
  const tracks = useAllTracks();
  const annivs = useAnniversaries();
  const playlists = usePlaylists();

  const today = todayKST();
  const upcomingTrack = useMemo(
    () =>
      (tracks.data ?? [])
        .filter((t) => !isReleased(t.date))
        .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null,
    [tracks.data],
  );
  const nextAnniv = useMemo(
    () =>
      (annivs.data ?? [])
        .filter((a) => a.nextDate >= today)
        .sort((a, b) => a.nextDate.localeCompare(b.nextDate))[0] ?? null,
    [annivs.data, today],
  );
  const recent = (tracks.data ?? []).slice(0, 8);
  const months = useMemo(() => {
    const map = new Map<string, TrackListItem[]>();
    for (const t of tracks.data ?? []) {
      const k = monthKey(t.date);
      map.set(k, [...(map.get(k) ?? []), t]);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [tracks.data]);

  const names = [profiles.data?.me?.nickname, profiles.data?.partner?.nickname]
    .filter(Boolean)
    .join(' & ');

  // 기록 0개 첫 실행 — 빈 섹션들 대신 히어로 하나로 (isSuccess 가드: 로딩 중 깜빡임 방지)
  const noTracks = tracks.isSuccess && (tracks.data ?? []).length === 0;

  return (
    <ScrollView style={{ backgroundColor: color.bg }} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* 헤더 */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 8,
        }}
      >
        <View>
          <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 26, letterSpacing: -0.5, color: color.white }}>
            플레이리스트
          </Text>
          <Meta style={{ marginTop: 2, fontSize: 12.5 }}>
            {names || '우리'} ·{' '}
            {couple.data?.startedAt ? (
              <Text style={{ color: role.me, fontFamily: typeface, fontWeight: '700' }}>
                {daysSince(couple.data.startedAt)}일째
              </Text>
            ) : null}
          </Meta>
        </View>
      </View>

      {noTracks ? (
        <FirstTrackHero onPress={() => router.push('/modals/create-track')} />
      ) : (
      <>
      {/* 다가오는 카드 2장 */}
      <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 14 }}>
        <UpcomingCard
          kicker="다가오는 데이트"
          tone="me"
          title={upcomingTrack?.title ?? '없음'}
          meta={upcomingTrack ? upcomingTrack.date.slice(5).replace('-', '.') : '데이트를 계획해보세요'}
          dday={upcomingTrack ? formatDday(upcomingTrack.date) : null}
          thumb={upcomingTrack?.coverThumbUrl ?? null}
          onPress={() =>
            upcomingTrack
              ? router.push(`/track/${upcomingTrack.id}`)
              : router.push('/modals/create-track')
          }
        />
        <UpcomingCard
          kicker="다가오는 기념일"
          tone="anniv"
          title={nextAnniv?.label ?? '없음'}
          meta={nextAnniv ? nextAnniv.nextDate.slice(5).replace('-', '.') : ''}
          dday={nextAnniv ? formatDday(nextAnniv.nextDate) : null}
          thumb={null}
          onPress={() => router.push('/(tabs)/playlist/singles')}
        />
      </View>

      {/* 최근 데이트 */}
      <SectionHeader title="최근 데이트" onMore={() => router.push('/(tabs)/playlist/queue')} />
      {recent.length === 0 ? (
        <EmptyRow text="아직 데이트 기록이 없어요" cta="첫 데이트 만들기" onPress={() => router.push('/modals/create-track')} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 14, paddingHorizontal: 16, paddingTop: 12 }}
        >
          {recent.map((t) => (
            <Pressable key={t.id} style={{ width: 132 }} onPress={() => router.push(`/track/${t.id}`)}>
              <View style={{ width: 132, height: 132, borderRadius: 4, overflow: 'hidden', backgroundColor: color.surface2 }}>
                {t.coverThumbUrl && (
                  <Image source={t.coverThumbUrl} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                )}
                {!isReleased(t.date) && (
                  <View style={{ position: 'absolute', left: 8, top: 8 }}>
                    <Dday>예정 · {formatDday(t.date)}</Dday>
                  </View>
                )}
              </View>
              <Text numberOfLines={1} style={{ fontFamily: typeface, fontWeight: '600', fontSize: 13.5, color: color.white, marginTop: 8 }}>
                {t.title}
              </Text>
              <Meta style={{ marginTop: 2, fontSize: 12 }}>{t.date.slice(5).replace('-', '.')}</Meta>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* 월별 플레이리스트 */}
      <SectionHeader title="월별 플레이리스트" />
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        {months.map(([k, list]) => (
          <Pressable
            key={k}
            onPress={() => router.push(`/(tabs)/playlist/${k}`)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}
          >
            <View style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', backgroundColor: color.surface2 }}>
              {list.find((t) => t.coverThumbUrl)?.coverThumbUrl && (
                <Image
                  source={list.find((t) => t.coverThumbUrl)!.coverThumbUrl!}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.white }}>
                {k.slice(0, 4)}년 {Number(k.slice(5))}월
              </Text>
              <Meta style={{ marginTop: 2, fontSize: 12.5 }}>{list.length} 데이트</Meta>
            </View>
            <Text style={{ fontFamily: typeface, color: color.muted }}>›</Text>
          </Pressable>
        ))}
        {months.length === 0 && <Meta style={{ paddingVertical: 10 }}>기록이 쌓이면 달별로 모여요</Meta>}
      </View>
      </>
      )}

      {/* 테마 플레이리스트 — 첫 실행이고 만든 플리도 없으면 숨김 */}
      {!(noTracks && (playlists.data ?? []).length === 0) && (
      <>
      <SectionHeader title="테마 플레이리스트" />
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        {(playlists.data ?? []).map((p) => (
          <Pressable
            key={p.id}
            onPress={() => router.push(`/(tabs)/playlist/custom/${p.id}`)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 8,
                backgroundColor: color.surface2,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: color.sub, fontFamily: typeface, fontWeight: '700' }}>{p.name.slice(0, 1)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.white }}>{p.name}</Text>
              <Meta style={{ marginTop: 2, fontSize: 12.5 }}>장소 {p.placeCount}곳</Meta>
            </View>
            <Text style={{ fontFamily: typeface, color: color.muted }}>›</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => router.push('/modals/new-playlist')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 8,
              backgroundColor: color.surface2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: typeface, color: color.white, fontSize: 20 }}>+</Text>
          </View>
          <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.sub }}>새 플레이리스트 만들기</Text>
        </Pressable>
      </View>
      </>
      )}

      {/* Singles 배너 */}
      <View style={{ paddingHorizontal: 16, paddingTop: 18 }}>
        <Pressable
          onPress={() => router.push('/(tabs)/playlist/singles')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            padding: 14,
            borderRadius: 14,
            backgroundColor: 'rgba(232,184,75,0.10)',
            borderWidth: 1,
            borderColor: 'rgba(232,184,75,0.18)',
          }}
        >
          <AnnivCover size={52} disc />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 15, color: color.white }}>Singles</Text>
            <Meta style={{ marginTop: 2, fontSize: 12.5 }}>기념일 모음 · {annivs.data?.length ?? 0}</Meta>
          </View>
          <StarGlyph size={14} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function SectionHeader({ title, onMore }: { title: string; onMore?: () => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 20,
      }}
    >
      <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 19, letterSpacing: -0.3, color: color.white }}>
        {title}
      </Text>
      {onMore && (
        <Pressable onPress={onMore}>
          <Meta style={{ fontSize: 12.5 }}>더보기</Meta>
        </Pressable>
      )}
    </View>
  );
}

function UpcomingCard({
  kicker,
  tone,
  title,
  meta,
  dday,
  thumb,
  onPress,
}: {
  kicker: string;
  tone: 'me' | 'anniv';
  title: string;
  meta: string;
  dday: string | null;
  thumb: string | null;
  onPress: () => void;
}) {
  const accent = tone === 'anniv' ? role.anniv : role.me;
  return (
    <Pressable
      onPress={onPress}
      style={{ flex: 1, borderRadius: 14, overflow: 'hidden', backgroundColor: color.surface1 }}
    >
      <View style={{ height: 92, backgroundColor: tone === 'anniv' ? '#2A2119' : color.surface2 }}>
        {thumb && <Image source={thumb} style={{ width: '100%', height: '100%' }} contentFit="cover" />}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(20,20,20,0.35)',
          }}
        />
        <View style={{ position: 'absolute', left: 12, top: 10 }}>
          <Eyebrow color={accent} style={{ fontSize: 9 }}>
            {kicker}
          </Eyebrow>
        </View>
        {dday && (
          <View style={{ position: 'absolute', right: 10, top: 10 }}>
            <Dday tone={tone === 'anniv' ? 'anniv' : 'me'}>{dday}</Dday>
          </View>
        )}
      </View>
      <View style={{ paddingHorizontal: 12, paddingVertical: 11 }}>
        <Text numberOfLines={1} style={{ fontFamily: typeface, fontWeight: '700', fontSize: 15, color: color.white }}>
          {title}
        </Text>
        <Meta style={{ marginTop: 3, fontSize: 12 }}>{meta}</Meta>
      </View>
    </Pressable>
  );
}

/** 기록 0개 첫 실행 히어로 — 빈 섹션 나열 대신 첫 트랙 만들기 하나에 집중 */
function FirstTrackHero({ onPress }: { onPress: () => void }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
      <Pressable
        onPress={onPress}
        style={{
          borderRadius: 14,
          backgroundColor: color.surface1,
          borderWidth: 1,
          borderColor: 'rgba(30,215,96,0.18)',
          paddingVertical: 28,
          paddingHorizontal: 20,
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Eyebrow color={role.me}>Track 01</Eyebrow>
        <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 21, color: color.white }}>
          첫 데이트를 기록해보세요
        </Text>
        <Meta style={{ textAlign: 'center' }}>데이트 하나가 트랙 하나로 쌓여요</Meta>
        <View
          style={{
            marginTop: 12,
            paddingHorizontal: 22,
            height: 40,
            borderRadius: 999,
            backgroundColor: color.greenCore,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 14, color: color.onPrimary }}>
            데이트 만들기
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

function EmptyRow({ text, cta, onPress }: { text: string; cta: string; onPress: () => void }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
      <Meta>{text}</Meta>
      <Pressable onPress={onPress} style={{ marginTop: 10 }}>
        <Text style={{ color: role.me, fontFamily: typeface, fontWeight: '600', fontSize: 13.5 }}>{cta}</Text>
      </Pressable>
    </View>
  );
}

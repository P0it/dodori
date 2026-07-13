import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { color, role, typeface } from '@/theme/tokens';
import { formatDday, todayKST } from '@/lib/date';
import { pickNextUp } from '@/lib/nextup';
import type { VisibleEvent } from '@/api/events';
import type { MonthTrack } from '@/api/tracks';
import type { AnnivItem } from '@/api/anniversaries';
import { Eyebrow } from '@/components/Eyebrow';
import { Meta } from '@/components/Meta';
import { Divider } from '@/components/Divider';
import { OwnerDot } from '@/components/OwnerDot';
import { Dday } from '@/components/Dday';
import { AnnivCover } from '@/components/AnnivCover';

type Props = {
  date: string;
  events: VisibleEvent[];
  tracks: MonthTrack[];
  annivs: AnnivItem[];
  uid?: string;
  /** "다음 일정" 한 줄용 — 선택일이 비어 있을 때만 쓴다 */
  allTracks: { id: string; title: string; date: string }[];
  allAnnivs: AnnivItem[];
};

const WEEKDAY = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

/** 선택일 어젠다 — 캘린더 그리드 아래에 상주한다 (목업 18·19 본문) */
export function DayAgenda({ date, events, tracks, annivs, uid, allTracks, allAnnivs }: Props) {
  const router = useRouter();

  const [y, m, d] = date.split('-').map(Number);
  const weekday = WEEKDAY[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  const anniv = annivs[0];
  const isToday = date === todayKST();
  const isBlank = !anniv && tracks.length === 0 && events.length === 0;
  const next = isBlank
    ? pickNextUp(
        allTracks,
        allAnnivs.map((a) => ({ id: a.id, label: a.label, nextDate: a.nextDate })),
      )
    : null;

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 22, color: color.white }}>
          {m}월 {d}일
        </Text>
        <Text style={{ fontFamily: typeface, fontWeight: '500', fontSize: 13, color: color.sub }}>{weekday}</Text>
        {isToday && (
          <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 12, color: role.me }}>오늘</Text>
        )}
      </View>

      {/* 기념일 (목업 19) */}
      {anniv && (
        <View style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 }}>
            <AnnivCover size={60} big={anniv.label.replace(/[^0-9]/g, '') || anniv.label[0]} small={/일$/.test(anniv.label) ? '일' : undefined} />
            <View style={{ flex: 1 }}>
              <Eyebrow color={role.anniv}>Single · 기념일</Eyebrow>
              <Text
                style={{ fontFamily: typeface, fontWeight: '800', fontSize: 22, color: color.white, marginTop: 2 }}
              >
                {anniv.label}
              </Text>
              <Meta style={{ marginTop: 2 }}>
                {date.replaceAll('-', '.')} · {formatDday(date)}
              </Meta>
            </View>
          </View>
          {tracks.length === 0 && (
            <View
              style={{
                backgroundColor: 'rgba(232,184,75,0.10)',
                borderWidth: 1,
                borderColor: 'rgba(232,184,75,0.25)',
                borderRadius: 12,
                padding: 14,
              }}
            >
              <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 14, color: color.white }}>
                아직 계획이 없어요
              </Text>
              <Meta style={{ marginTop: 4, lineHeight: 19 }}>
                이 날을 특별하게 만들어 볼까요? 데이트를 만들면 {anniv.label}이 하나의 싱글로 남아요.
              </Meta>
            </View>
          )}
        </View>
      )}

      {/* 데이트 (목업 18) */}
      {tracks.length > 0 && (
        <>
          <Eyebrow style={{ marginBottom: 2 }}>데이트</Eyebrow>
          {tracks.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => router.push(`/track/${t.id}`)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: color.surface2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.white }}>
                  {t.title}
                </Text>
                <Meta style={{ marginTop: 2 }}>{t.date.replaceAll('-', '.')}</Meta>
              </View>
              <Dday>{formatDday(t.date)}</Dday>
            </Pressable>
          ))}
          <Divider style={{ marginVertical: 2 }} />
        </>
      )}

      {/* 개인 일정 */}
      <Eyebrow style={{ marginTop: 10, marginBottom: 2 }}>개인 일정</Eyebrow>
      {events.length === 0 ? (
        <Meta style={{ paddingVertical: 10 }}>일정이 없어요</Meta>
      ) : (
        events.map((e) => {
          const mine = e.owner_id === uid;
          const time = e.all_day
            ? '종일'
            : new Date(e.starts_at!).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'Asia/Seoul',
              });
          return (
            <Pressable
              key={e.id}
              onPress={
                mine
                  ? () => router.push({ pathname: '/modals/add-event', params: { id: e.id! } })
                  : undefined
              }
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 }}
            >
              <View style={{ width: 44, alignItems: 'center', gap: 6 }}>
                <OwnerDot who={mine ? 'me' : 'partner'} size={9} />
                <Text style={{ fontFamily: typeface, fontSize: 11, color: color.sub }}>{time}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.white }}>
                  {e.title}
                </Text>
                {mine && e.title_hidden ? (
                  <Meta style={{ marginTop: 2, fontSize: 12 }}>상대에겐 "바쁨"으로 보여요</Meta>
                ) : null}
              </View>
              {mine && <Text style={{ fontFamily: typeface, fontSize: 12, color: color.muted }}>수정</Text>}
            </Pressable>
          );
        })
      )}

      {/* 비어 있는 날이면 "다음 일정" 한 줄 — 앱 전체에서 여기 한 번만 */}
      {next && (
        <Pressable
          onPress={() =>
            next.kind === 'track'
              ? router.push(`/track/${next.id}`)
              : router.push('/(tabs)/playlist/singles')
          }
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }}
        >
          <Eyebrow color={next.kind === 'anniv' ? role.anniv : role.me}>다음 일정</Eyebrow>
          <Text
            numberOfLines={1}
            style={{ flex: 1, fontFamily: typeface, fontWeight: '600', fontSize: 13.5, color: color.white }}
          >
            {next.kind === 'track' ? next.title : next.label}
          </Text>
          <Meta style={{ fontSize: 12 }}>
            {next.date.slice(5).replace('-', '.')} · {formatDday(next.date)}
          </Meta>
        </Pressable>
      )}

      {/* CTA */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <Pressable
          onPress={() => router.push({ pathname: '/modals/create-track', params: { date } })}
          style={({ pressed }) => ({
            flex: 1,
            height: 46,
            borderRadius: 999,
            backgroundColor: anniv ? role.anniv : role.me,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 14, color: color.onPrimary }}>
            {anniv ? `${anniv.label} 데이트 계획하기` : '이 날 데이트 만들기'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push({ pathname: '/modals/add-event', params: { date } })}
          style={({ pressed }) => ({
            paddingHorizontal: 18,
            height: 46,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 14, color: color.white }}>일정 추가</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

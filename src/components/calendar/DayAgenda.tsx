import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { color, role, typeface } from '@/theme/tokens';
import { formatDday, todayKST } from '@/lib/date';
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
};

const WEEKDAY = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

/** 선택일 어젠다 — 캘린더 그리드 아래에 상주한다 (목업 18·19 본문) */
export function DayAgenda({ date, events, tracks, annivs, uid }: Props) {
  const router = useRouter();

  const [y, m, d] = date.split('-').map(Number);
  const weekday = WEEKDAY[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  const anniv = annivs[0];
  const isToday = date === todayKST();

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 80 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 22, color: color.white }}>
            {m}월 {d}일
          </Text>
          <Text style={{ fontFamily: typeface, fontWeight: '500', fontSize: 13, color: color.sub }}>{weekday}</Text>
          {isToday && (
            <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 12, color: role.me }}>오늘</Text>
          )}
        </View>
      </View>

      {/* 기념일 (목업 19) */}
      {anniv && (
        <View style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 }}>
            <AnnivCover size={60} big={anniv.label.replace(/[^0-9]/g, '') || anniv.label[0]} small={/일$/.test(anniv.label) ? '일' : undefined} />
            <View style={{ flex: 1 }}>
              <Eyebrow color={role.anniv}>기념일</Eyebrow>
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
                이 날을 특별하게 만들어 볼까요? 데이트를 만들면 {anniv.label}을 데이트로 남길 수 있어요.
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
              <Dday tone="date">{formatDday(t.date)}</Dday>
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
              onPress={() => router.push({ pathname: '/modals/add-event', params: { id: e.id! } })}
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
                {e.description ? (
                  <Text
                    numberOfLines={1}
                    style={{ fontFamily: typeface, fontSize: 12, color: color.sub, marginTop: 2 }}
                  >
                    {e.description}
                  </Text>
                ) : null}
              </View>
              <Text style={{ fontFamily: typeface, fontSize: 12, color: color.muted }}>수정</Text>
            </Pressable>
          );
        })
      )}

    </ScrollView>
  );
}

import { Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { color, eventColor, toEventColor, typeface } from '@/theme/tokens';
import { formatDday, todayKST } from '@/lib/date';
import { daySpan, eventDayRange } from '@/lib/span';
import type { VisibleEvent } from '@/api/events';
import type { MonthTrack } from '@/api/tracks';
import type { AnnivItem } from '@/api/anniversaries';
import { Eyebrow } from '@/components/Eyebrow';
import { Meta } from '@/components/Meta';
import { Divider } from '@/components/Divider';
import { Avatar } from '@/components/Avatar';
import { Dday } from '@/components/Dday';
import { PinGlyph } from '@/components/glyphs';
import { AnnivCover } from '@/components/AnnivCover';

type Props = {
  date: string;
  events: VisibleEvent[];
  tracks: MonthTrack[];
  annivs: AnnivItem[];
  /** 일정 주인 표시용 — 화면이 프로필을 알고 있으니 조회 결과만 내려받는다 */
  name: (uid: string) => string;
  avatarUrl: (uid: string) => string | null;
};

const WEEKDAY = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

function kstHHmm(iso: string): string {
  return new Date(iso).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  });
}

/** 선택일 어젠다 — 캘린더 그리드 아래에 상주한다 (목업 18·19 본문) */
export function DayAgenda({ date, events, tracks, annivs, name, avatarUrl }: Props) {
  const router = useRouter();

  const [y, m, d] = date.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const weekday = WEEKDAY[dow];
  // 주말은 그리드와 같은 색으로 — 일=빨강, 토=파랑
  const weekendTint = dow === 0 ? color.sunday : dow === 6 ? color.saturday : null;
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
          <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 22, color: weekendTint ?? color.white }}>
            {m}월 {d}일
          </Text>
          <Text style={{ fontFamily: typeface, fontWeight: '500', fontSize: 13, color: weekendTint ?? color.sub }}>{weekday}</Text>
          {isToday && (
            <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 12, color: color.accent }}>오늘</Text>
          )}
        </View>
      </View>

      {/* 기념일 (목업 19) */}
      {anniv && (
        <View style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 }}>
            <AnnivCover size={60} big={anniv.label.replace(/[^0-9]/g, '') || anniv.label[0]} small={/일$/.test(anniv.label) ? '일' : undefined} />
            <View style={{ flex: 1 }}>
              <Eyebrow color={color.anniv}>기념일</Eyebrow>
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
              {t.coverThumbUrl ? (
                <Image
                  source={t.coverThumbUrl}
                  style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: color.surface2 }}
                  contentFit="cover"
                  transition={160}
                />
              ) : (
                <View style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: color.surface2 }} />
              )}
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
          const tint = eventColor[toEventColor(e.color)];
          const { from, to } = eventDayRange(e.starts_at!, e.ends_at);
          const total = daySpan(from, to);
          // 여러 날 일정은 이 날이 며칠째인지가 시각보다 중요하다 — 3일째 아침에 '19:00'은 거짓말이다
          const time =
            total > 1
              ? `${daySpan(from, date)}/${total}일`
              : e.all_day
                ? '종일'
                : kstHHmm(e.starts_at!);
          return (
            <Pressable
              key={e.id}
              onPress={() => router.push({ pathname: '/modals/add-event', params: { id: e.id! } })}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 11,
                // 장소·설명이 없는 일정은 한 줄이라 42px까지 내려간다 — 손가락이 닿는 최소치를 지킨다
                minHeight: 44,
              }}
            >
              {/* 일정 색 — 사람이 아니라 이 일정의 색 */}
              <View style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, backgroundColor: tint.fg }} />
              <Text numberOfLines={1} style={{ fontFamily: typeface, fontSize: 11, color: color.sub, width: 44 }}>
                {time}
              </Text>
              {/*
                한 일정이 세로로 길어지면 30%짜리 아젠다에 두 개도 못 들어간다.
                제목 한 줄 + 장소·설명 한 줄로 접고, 작성자는 우측 여백으로 뺀다.
                장소와 설명은 둘 다 부차 정보라 같은 줄에서 가운뎃점으로 잇는다.
              */}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.white }}
                >
                  {e.title}
                </Text>
                {(e.place?.name || e.description) && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                    {e.place?.name ? <PinGlyph size={11} color={color.muted} /> : null}
                    <Meta numberOfLines={1} style={{ flex: 1, fontSize: 12 }}>
                      {[e.place?.name, e.description].filter(Boolean).join(' · ')}
                    </Meta>
                  </View>
                )}
              </View>
              {/*
                작성자 — 아바타만. 두 사람뿐이라 이름을 덧붙이면 폭만 먹는다.
                "수정" 글자는 뺐다 — 행 전체가 이미 눌러서 편집으로 들어가는 중복 어포던스였다.
              */}
              {e.owner_id && (
                <Avatar url={avatarUrl(e.owner_id)} name={name(e.owner_id)} size={20} />
              )}
            </Pressable>
          );
        })
      )}

    </ScrollView>
  );
}

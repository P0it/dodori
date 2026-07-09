import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { color, role } from '@/theme/tokens';
import { formatDday } from '@/lib/date';
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
  date: string | null;
  onClose: () => void;
  events: VisibleEvent[];
  tracks: MonthTrack[];
  annivs: AnnivItem[];
  uid?: string;
};

const WEEKDAY = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

/** 선택일 바텀 시트 (목업 18·19) */
export function DaySheet({ date, onClose, events, tracks, annivs, uid }: Props) {
  const router = useRouter();
  if (!date) return null;

  const [y, m, d] = date.split('-').map(Number);
  const weekday = WEEKDAY[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  const anniv = annivs[0];

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} onPress={onClose} />
      <View
        style={{
          backgroundColor: '#1c1c1c',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingTop: 10,
          paddingBottom: 32,
          maxHeight: '78%',
        }}
      >
        <View
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.25)',
            alignSelf: 'center',
            marginBottom: 14,
          }}
        />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <Text style={{ fontWeight: '800', fontSize: 22, color: color.white }}>
              {m}월 {d}일
            </Text>
            <Text style={{ fontWeight: '500', fontSize: 13, color: color.sub }}>{weekday}</Text>
          </View>

          {/* 기념일 (목업 19) */}
          {anniv && (
            <View style={{ marginBottom: 12 }}>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 }}
              >
                <AnnivCover size={60} big={anniv.label.replace(/[^0-9]/g, '') || anniv.label[0]} small={/일$/.test(anniv.label) ? '일' : undefined} />
                <View style={{ flex: 1 }}>
                  <Eyebrow color={role.anniv}>Single · 기념일</Eyebrow>
                  <Text
                    style={{ fontWeight: '800', fontSize: 22, color: color.white, marginTop: 2 }}
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
                  <Text style={{ fontWeight: '700', fontSize: 14, color: color.white }}>
                    아직 계획이 없어요
                  </Text>
                  <Meta style={{ marginTop: 4, lineHeight: 19 }}>
                    이 날을 특별하게 만들어 볼까요? 데이트를 만들면 {anniv.label}이 하나의 싱글로
                    남아요.
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
                  onPress={() => {
                    onClose();
                    router.push(`/track/${t.id}`);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 11,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      backgroundColor: color.surface2,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600', fontSize: 15, color: color.white }}>
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
                      ? () => {
                          onClose();
                          router.push({ pathname: '/modals/add-event', params: { id: e.id! } });
                        }
                      : undefined
                  }
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 11,
                  }}
                >
                  <View style={{ width: 44, alignItems: 'center', gap: 6 }}>
                    <OwnerDot who={mine ? 'me' : 'partner'} size={9} />
                    <Text style={{ fontSize: 11, color: color.sub }}>{time}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600', fontSize: 15, color: color.white }}>
                      {e.title}
                    </Text>
                    {mine && e.title_hidden ? (
                      <Meta style={{ marginTop: 2, fontSize: 12 }}>상대에겐 "바쁨"으로 보여요</Meta>
                    ) : null}
                  </View>
                  {mine && (
                    <Text style={{ fontSize: 12, color: color.muted }}>수정</Text>
                  )}
                </Pressable>
              );
            })
          )}

          {/* CTA */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <Pressable
              onPress={() => {
                onClose();
                router.push({ pathname: '/modals/create-track', params: { date } });
              }}
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
              <Text style={{ fontWeight: '700', fontSize: 14, color: color.onPrimary }}>
                {anniv ? `${anniv.label} 데이트 계획하기` : '이 날 데이트 만들기'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onClose();
                router.push({ pathname: '/modals/add-event', params: { date } });
              }}
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
              <Text style={{ fontWeight: '600', fontSize: 14, color: color.white }}>일정 추가</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

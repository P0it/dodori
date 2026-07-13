import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { color, role, typeface } from '@/theme/tokens';
import { todayKST } from '@/lib/date';
import { useCoupleProfiles } from '@/api/couple';
import { useTodayTopic, useTopicVotes, useTopicComments, usePastTopics } from '@/api/topics';
import { Meta } from '@/components/Meta';
import { Eyebrow } from '@/components/Eyebrow';
import { OwnerDot } from '@/components/OwnerDot';

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];

/** 오늘 탭 — 오늘의 주제 카드 하나. 투표·토론은 상세(topic/[id])에서 */
export default function Today() {
  const router = useRouter();
  const profiles = useCoupleProfiles();
  const topic = useTodayTopic();
  const votes = useTopicVotes(topic.data?.id);
  const comments = useTopicComments(topic.data?.id);
  const past = usePastTopics();

  const partnerName = profiles.data?.partner?.nickname || '상대';

  if (!topic.data) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, alignItems: 'center', justifyContent: 'center' }}>
        {topic.isError ? <Meta>주제를 불러오지 못했어요</Meta> : <ActivityIndicator color={color.sub} />}
      </View>
    );
  }

  const today = todayKST();
  const [, m, d] = today.split('-').map(Number);
  const weekday = WEEKDAY[new Date(`${today}T00:00:00Z`).getUTCDay()];

  const mine = votes.data?.mine ?? null;
  const partner = votes.data?.partner ?? null;
  const talkCount = (comments.data ?? []).filter((c) => c.parentId === null).length;

  return (
    <ScrollView
      style={{ backgroundColor: color.bg }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
        <Text
          style={{
            fontFamily: typeface,
            fontWeight: '800',
            fontSize: 28,
            letterSpacing: -0.5,
            color: color.white,
          }}
        >
          오늘
        </Text>
        <Meta style={{ fontSize: 13 }}>
          {m}월 {d}일 ({weekday})
        </Meta>
      </View>

      {/* 오늘의 주제 카드 — 화면의 주인공 */}
      <Pressable
        onPress={() => router.push(`/topic/${topic.data!.id}`)}
        style={({ pressed }) => ({
          marginTop: 16,
          borderRadius: 20,
          paddingHorizontal: 20,
          paddingVertical: 24,
          backgroundColor: color.surface1,
          borderWidth: 1,
          borderColor: mine === null ? role.me : color.surface2,
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <Eyebrow color={role.me}>오늘의 주제</Eyebrow>

        <Text
          style={{
            fontFamily: typeface,
            fontWeight: '800',
            fontSize: 25,
            lineHeight: 35,
            letterSpacing: -0.4,
            color: color.white,
            marginTop: 10,
          }}
        >
          {topic.data.question}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20 }}>
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: mine ? role.me : color.muted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {mine && <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: role.me }} />}
          </View>
          <Text
            style={{
              fontFamily: typeface,
              fontWeight: '700',
              fontSize: 14.5,
              color: mine ? color.white : role.me,
              flex: 1,
            }}
          >
            {mine === null
              ? '아직 안 골랐어요 — 눌러서 고르기'
              : partner === null
                ? `${partnerName}님을 기다리는 중`
                : partner === mine
                  ? '둘 다 같은 답이에요'
                  : '답이 갈렸어요'}
          </Text>
          {mine !== null && (
            <Meta style={{ fontSize: 12.5 }}>대화 {talkCount}</Meta>
          )}
        </View>
      </Pressable>

      {/* 지난 주제 */}
      {(past.data ?? []).length > 0 && (
        <>
          <Text
            style={{
              fontFamily: typeface,
              fontWeight: '700',
              fontSize: 18,
              letterSpacing: -0.3,
              color: color.white,
              marginTop: 32,
              marginBottom: 4,
            }}
          >
            지난 주제
          </Text>
          {(past.data ?? []).map((p) => (
            <Pressable
              key={p.id}
              onPress={() => router.push(`/topic/${p.id}`)}
              style={({ pressed }) => ({
                paddingVertical: 13,
                borderTopWidth: 1,
                borderTopColor: color.surface1,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                numberOfLines={1}
                style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.white }}
              >
                {p.question}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 }}>
                {p.mine === null ? (
                  <Meta style={{ fontSize: 12.5 }}>지나갔어요</Meta>
                ) : (
                  <>
                    <PickChip who="me" label={p.mine === 'a' ? p.optionA : p.optionB} />
                    {p.partner && (
                      <PickChip who="partner" label={p.partner === 'a' ? p.optionA : p.optionB} />
                    )}
                  </>
                )}
              </View>
            </Pressable>
          ))}
        </>
      )}
    </ScrollView>
  );
}

function PickChip({ who, label }: { who: 'me' | 'partner'; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 }}>
      <OwnerDot who={who} size={7} />
      <Text numberOfLines={1} style={{ fontFamily: typeface, fontSize: 12.5, color: color.sub }}>
        {label}
      </Text>
    </View>
  );
}

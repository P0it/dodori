import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { color, typeface } from '@/theme/tokens';
import { todayKST } from '@/lib/date';
import { useCoupleProfiles } from '@/api/couple';
import { useSession } from '@/api/auth';
import { useTodayTopic, useTopicVotes, useTopicComments } from '@/api/topics';
import { useTodaySong } from '@/api/songs';
import { useStories } from '@/api/stories';
import { liveStories, ringState } from '@/lib/stories';
import { Meta } from '@/components/Meta';
import { Eyebrow } from '@/components/Eyebrow';
import { SongCard } from '@/components/SongCard';
import { StoryRing } from '@/components/story/StoryRing';

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];

/** 오늘 탭 — 오늘의 추천곡(히어로) + 오늘의 주제. 투표·토론은 상세(topic/[id])에서 */
export default function Today() {
  const router = useRouter();
  const profiles = useCoupleProfiles();
  const topic = useTodayTopic();
  const votes = useTopicVotes(topic.data?.id);
  const comments = useTopicComments(topic.data?.id);
  const song = useTodaySong();

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
            fontSize: 22,
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

      <StoryRings />

      {/* 오늘의 추천곡 — 화면의 주인공. 곡 풀이 비었거나 못 불러오면 조용히 생략 */}
      {song && <SongCard song={song} />}

      {/* 오늘의 주제 — 추천곡 아래 보조 항목 */}
      <Pressable
        onPress={() => router.push(`/topic/${topic.data!.id}`)}
        style={({ pressed }) => ({
          marginTop: 20,
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: 16,
          backgroundColor: color.surface1,
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <Eyebrow>오늘의 주제</Eyebrow>

        <Text
          numberOfLines={2}
          style={{
            fontFamily: typeface,
            fontWeight: '700',
            fontSize: 16,
            lineHeight: 23,
            letterSpacing: -0.2,
            color: color.white,
            marginTop: 8,
          }}
        >
          {topic.data.question}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
          <View
            style={{
              width: 16,
              height: 16,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: mine ? color.accent : color.muted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {mine && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color.accent }} />}
          </View>
          <Meta style={{ fontSize: 12.5, flex: 1 }}>
            {mine === null
              ? '아직 안 골랐어요 — 눌러서 고르기'
              : partner === null
                ? `${partnerName}님을 기다리는 중`
                : partner === mine
                  ? '둘 다 같은 답이에요'
                  : '답이 갈렸어요'}
          </Meta>
          {mine !== null && <Meta style={{ fontSize: 12.5 }}>대화 {talkCount}</Meta>}
        </View>
      </Pressable>
    </ScrollView>
  );
}

/**
 * 스토리 링 — 나·상대 두 개. 24시간 내 스토리가 없어도 자리를 비우지 않는다.
 * 상대 링은 볼 게 없으면 눌러도 아무 일이 없다 (빈 뷰어를 열지 않는다).
 */
function StoryRings() {
  const router = useRouter();
  const session = useSession();
  const profiles = useCoupleProfiles();
  const stories = useStories();

  const uid = session.data?.user.id ?? '';
  const all = stories.data ?? [];
  const live = liveStories(all);

  const open = (authorId: string) => {
    const first = live.find((s) => s.authorId === authorId && s.seenAt === null)
      ?? live.find((s) => s.authorId === authorId);
    if (first) router.push(`/story/${first.id}`);
  };

  const partnerId = profiles.data?.partner?.id;

  return (
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
      <StoryRing
        name={profiles.data?.me?.nickname || '나'}
        avatarUrl={profiles.data?.me?.avatar_url ?? null}
        state={ringState(all, uid)}
        onPress={() =>
          live.some((s) => s.authorId === uid) ? open(uid) : router.push('/modals/create-story')
        }
        onPressAdd={() => router.push('/modals/create-story')}
      />
      {partnerId && (
        <StoryRing
          name={profiles.data?.partner?.nickname || '상대'}
          avatarUrl={profiles.data?.partner?.avatar_url ?? null}
          state={ringState(all, partnerId)}
          onPress={() => open(partnerId)}
        />
      )}
    </View>
  );
}

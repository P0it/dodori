import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { color, typeface } from '@/theme/tokens';
import { useSession } from '@/api/auth';
import { useCoupleProfiles } from '@/api/couple';
import {
  useTopic,
  useTodayTopic,
  useTopicVotes,
  useVote,
  useTopicComments,
  useAddComment,
  usePastTopics,
  CHOICE_KEYS,
  type Choice,
  type TopicComment,
} from '@/api/topics';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';
import { Eyebrow } from '@/components/Eyebrow';
import { ChoiceRow } from '@/components/topic/ChoiceRow';
import { CommentList } from '@/components/topic/CommentList';
import { PastTopicCard } from '@/components/topic/PastTopicCard';

/** 되돌아보기는 14개씩 늘린다 (게임 쪽 PAST_STEP과 같은 결) */
const PAST_STEP = 14;

/** 주제 상세 — 투표하고, 상대 답을 확인하고, 토론한다 */
export default function TopicDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const session = useSession();
  const uid = session.data?.user.id;
  const profiles = useCoupleProfiles();

  const topic = useTopic(id);
  const votes = useTopicVotes(id);
  const comments = useTopicComments(id);
  const vote = useVote(id);
  const addComment = useAddComment(id);

  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<TopicComment | null>(null);
  const [pastCount, setPastCount] = useState(PAST_STEP);
  /** 아직 제출하지 않은 임시 선택 — 한 번 탭으로 바로 제출되지 않게 확인 버튼을 거친다 */
  const [pending, setPending] = useState<Choice | null>(null);

  // 이 라우트는 지난 주제로도 들어온다 — 목록은 오늘 주제를 볼 때만 붙인다(안 그러면 재귀)
  const todayTopic = useTodayTopic();
  const isToday = !!id && todayTopic.data?.id === id;
  /** 오늘 주제가 뭔지 알기 전엔 '오늘의 주제'로 둔다 — 로딩 중 제목이 깜빡이지 않게 */
  const isPast = !!todayTopic.data && !isToday;
  const past = usePastTopics(pastCount);

  const myName = profiles.data?.me?.nickname || '나';
  const partnerName = profiles.data?.partner?.nickname || '상대';
  const avatarUrl = (authorId: string): string | null =>
    (authorId === uid ? profiles.data?.me?.avatar_url : profiles.data?.partner?.avatar_url) ?? null;

  const mine = votes.data?.mine ?? null;
  const partner = votes.data?.partner ?? null;
  const locked = mine === null;
  /** 상대가 고르기 전이면 다시 고를 수 있다 — 볼 상대 답이 없으니 뒤집기가 성립하지 않는다 */
  const editable = mine === null || partner === null;
  /** 라디오는 임시 선택(pending)을 먼저 비추고, 없으면 확정(mine)을 보여준다 */
  const shown = pending ?? mine;
  /** 확인 버튼은 편집 가능하고 임시 선택이 확정과 다를 때만 — 첫 제출·답 바꾸기 공통 */
  const showConfirm = editable && pending !== null && pending !== mine;

  const pickedBy = (c: Choice): string[] => {
    const names: string[] = [];
    if (mine === c) names.push(myName);
    if (partner === c) names.push(partnerName);
    return names;
  };

  const onSend = () => {
    const body = draft.trim();
    if (!body) return;
    addComment.mutate(
      { body, parentId: replyTo?.id ?? null },
      {
        onSuccess: () => {
          setDraft('');
          setReplyTo(null);
        },
      },
    );
  };

  if (!topic.data) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg }}>
        <TopBar title={isPast ? '지난 주제' : '오늘의 주제'} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {topic.isError ? <Meta>주제를 불러오지 못했어요</Meta> : <ActivityIndicator color={color.sub} />}
        </View>
      </View>
    );
  }

  const list = comments.data ?? [];
  const rootCount = list.filter((c) => c.parentId === null).length;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: color.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TopBar title={isPast ? '지난 주제' : '오늘의 주제'} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 }}>
        <Text
          style={{
            fontFamily: typeface,
            fontWeight: '800',
            fontSize: 24,
            lineHeight: 34,
            letterSpacing: -0.4,
            color: color.white,
          }}
        >
          {topic.data.question}
        </Text>

        <View style={{ gap: 10, marginTop: 18 }}>
          {topic.data.options.map((label, i) => {
            const key = CHOICE_KEYS[i];
            return (
              <ChoiceRow
                key={key}
                label={label}
                pickedBy={pickedBy(key)}
                selected={shown === key}
                disabled={!editable || vote.isPending}
                onPress={() => setPending(key)}
              />
            );
          })}
        </View>

        {/* 확인 버튼 — 탭으로 고른 답을 여기서 제출한다 (한 번 탭에 바로 제출되지 않게) */}
        {showConfirm && (
          <Pressable
            onPress={() => pending && vote.mutate(pending)}
            disabled={vote.isPending}
            style={({ pressed }) => ({
              marginTop: 14,
              height: 50,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: color.accent,
              opacity: pressed || vote.isPending ? 0.85 : 1,
            })}
          >
            <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 15, color: color.onPrimary }}>
              {vote.isPending ? '정하는 중…' : mine === null ? '이 답으로 정하기' : '이 답으로 바꾸기'}
            </Text>
          </Pressable>
        )}

        {locked ? (
          <View
            style={{
              marginTop: 20,
              paddingVertical: 22,
              paddingHorizontal: 20,
              borderRadius: 14,
              backgroundColor: color.surface1,
              borderWidth: 1,
              borderColor: color.surface2,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 15, color: color.white }}>
              하나 고르면 열려요
            </Text>
            <Meta style={{ marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
              {partnerName}님의 답과 대화는 내가 고른 뒤에 볼 수 있어요.
            </Meta>
          </View>
        ) : (
          <>
            {/* 누가 뭘 골랐는지는 선택지에 이름으로 붙는다 — 판정 문구는 같은 말의 반복.
                상대를 기다리는 동안만, 아직 바꿀 수 있다는 걸 알린다 (UI로는 안 보인다) */}
            {partner === null && (
              <Meta style={{ marginTop: 16, textAlign: 'center' }}>
                {partnerName}님을 기다리는 중 · 아직 바꿀 수 있어요
              </Meta>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 26, marginBottom: 6 }}>
              <Text
                style={{
                  fontFamily: typeface,
                  fontWeight: '700',
                  fontSize: 18,
                  letterSpacing: -0.3,
                  color: color.white,
                }}
              >
                대화
              </Text>
              {rootCount > 0 && (
                <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 14, color: color.muted }}>
                  {rootCount}
                </Text>
              )}
            </View>

            <CommentList
              comments={list}
              uid={uid}
              myName={myName}
              partnerName={partnerName}
              avatarUrl={avatarUrl}
              onReply={setReplyTo}
            />

            <View style={{ marginTop: 16 }}>
              {replyTo && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderTopLeftRadius: 12,
                    borderTopRightRadius: 12,
                    backgroundColor: color.surface2,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{ flex: 1, fontFamily: typeface, fontSize: 12.5, color: color.sub }}
                  >
                    {replyTo.authorId === uid ? myName : partnerName}님에게 답글 · {replyTo.body}
                  </Text>
                  <Pressable onPress={() => setReplyTo(null)} hitSlop={8}>
                    <Text style={{ fontFamily: typeface, fontSize: 15, color: color.sub }}>×</Text>
                  </Pressable>
                </View>
              )}
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="왜 그렇게 생각하는지 적어보세요"
                placeholderTextColor={color.muted}
                style={{
                  minHeight: 88,
                  maxHeight: 200,
                  borderRadius: 14,
                  borderTopLeftRadius: replyTo ? 0 : 14,
                  borderTopRightRadius: replyTo ? 0 : 14,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  backgroundColor: color.surface1,
                  borderWidth: 1,
                  borderColor: color.surface2,
                  color: color.white,
                  fontFamily: typeface,
                  fontSize: 15,
                  lineHeight: 22,
                  textAlignVertical: 'top',
                }}
                multiline
              />
              <Pressable
                onPress={onSend}
                disabled={!draft.trim() || addComment.isPending}
                style={({ pressed }) => ({
                  alignSelf: 'flex-end',
                  marginTop: 10,
                  paddingHorizontal: 22,
                  height: 42,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: draft.trim() ? color.accent : color.surface2,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text
                  style={{
                    fontFamily: typeface,
                    fontWeight: '700',
                    fontSize: 14,
                    color: draft.trim() ? color.onPrimary : color.muted,
                  }}
                >
                  남기기
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {/* 오늘 주제일 때만. 투표 전이라도 지난 주제는 볼 수 있다 */}
        {isToday && (past.data ?? []).length > 0 && (
          <View style={{ marginTop: 32 }}>
            <Eyebrow>지난 주제</Eyebrow>
            {(past.data ?? []).map((p) => (
              <PastTopicCard
                key={p.id}
                topic={p}
                myName={myName}
                partnerName={partnerName}
                onPress={() => router.push(`/topic/${p.id}`)}
              />
            ))}
            <Pressable
              onPress={() => setPastCount((c) => c + PAST_STEP)}
              style={({ pressed }) => ({
                marginTop: 16,
                height: 46,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: color.surface2,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{ fontFamily: typeface, fontWeight: '700', fontSize: 14, color: color.sub }}
              >
                더 보기
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

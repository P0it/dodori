import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useSession } from './auth';
import { useMyCouple } from './couple';
import { toKSTDate, todayKST } from '@/lib/date';
import { topicSeqForDay } from '@/lib/topics';

export interface Topic {
  id: string;
  seq: number;
  question: string;
  optionA: string;
  optionB: string;
}

export type Choice = 'a' | 'b';

/** 전체 주제 개수 — 순환 배정의 나눗수. 시드가 늘면 자연히 반영된다 */
function useTopicCount() {
  return useQuery({
    queryKey: ['topics', 'count', 'v2'],
    staleTime: 60 * 60 * 1000,
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.from('topics').select('seq');
      if (error) throw error;
      return data.length;
    },
  });
}

/** 오늘의 주제 — 커플 생성일부터 n일째 → n번 (배정 테이블·cron 없음) */
export function useTodayTopic() {
  const couple = useMyCouple();
  const total = useTopicCount();
  const createdAt = couple.data?.createdAt;
  const count = total.data ?? 0;
  const seq = createdAt && count > 0
    ? topicSeqForDay(toKSTDate(new Date(createdAt)), todayKST(), count)
    : null;

  return useQuery({
    enabled: seq !== null,
    queryKey: ['topics', 'seq', seq],
    queryFn: async (): Promise<Topic> => {
      const { data, error } = await supabase
        .from('topics')
        .select('id, seq, question, option_a, option_b')
        .eq('seq', seq!)
        .single();
      if (error) throw error;
      return {
        id: data.id,
        seq: data.seq,
        question: data.question,
        optionA: data.option_a,
        optionB: data.option_b,
      };
    },
  });
}

/** 주제 1건 (상세 화면) */
export function useTopic(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ['topic', id],
    queryFn: async (): Promise<Topic> => {
      const { data, error } = await supabase
        .from('topics')
        .select('id, seq, question, option_a, option_b')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return {
        id: data.id,
        seq: data.seq,
        question: data.question,
        optionA: data.option_a,
        optionB: data.option_b,
      };
    },
  });
}

export interface TopicVotes {
  mine: Choice | null;
  /** RLS가 가린다 — 내가 투표하기 전엔 항상 null */
  partner: Choice | null;
}

export function useTopicVotes(topicId: string | undefined) {
  const session = useSession();
  const uid = session.data?.user.id;
  return useQuery({
    enabled: !!topicId && !!uid,
    queryKey: ['topicVotes', topicId],
    queryFn: async (): Promise<TopicVotes> => {
      const { data, error } = await supabase
        .from('topic_votes')
        .select('user_id, choice')
        .eq('topic_id', topicId!);
      if (error) throw error;
      return {
        mine: (data.find((v) => v.user_id === uid)?.choice as Choice) ?? null,
        partner: (data.find((v) => v.user_id !== uid)?.choice as Choice) ?? null,
      };
    },
  });
}

/** 투표 — 상대가 고르기 전까진 바꿀 수 있다. 상대가 고르는 순간 RLS가 update를 막는다 */
export function useVote(topicId: string | undefined) {
  const qc = useQueryClient();
  const couple = useMyCouple();
  return useMutation({
    mutationFn: async (choice: Choice) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid || !couple.data || !topicId) throw new Error('로그인·연결이 필요해요');
      const { error } = await supabase.from('topic_votes').upsert({
        couple_id: couple.data.coupleId,
        topic_id: topicId,
        user_id: uid,
        choice,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['topicVotes', topicId] });
      qc.invalidateQueries({ queryKey: ['topicComments', topicId] }); // 투표해야 열린다
      qc.invalidateQueries({ queryKey: ['pastTopics'] });
    },
  });
}

export interface TopicComment {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
  /** 1단계 답글 — 원 댓글의 id. 답글에는 다시 답글을 달지 않는다 */
  parentId: string | null;
}

/** 댓글 — 투표 전에는 RLS가 읽기 자체를 막는다 (빈 배열) */
export function useTopicComments(topicId: string | undefined) {
  return useQuery({
    enabled: !!topicId,
    queryKey: ['topicComments', topicId],
    queryFn: async (): Promise<TopicComment[]> => {
      const { data, error } = await supabase
        .from('topic_comments')
        .select('id, author_id, body, created_at, parent_id')
        .eq('topic_id', topicId!)
        .order('created_at');
      if (error) throw error;
      return data.map((c) => ({
        id: c.id,
        authorId: c.author_id,
        body: c.body,
        createdAt: c.created_at,
        parentId: c.parent_id,
      }));
    },
  });
}

export function useAddComment(topicId: string | undefined) {
  const qc = useQueryClient();
  const couple = useMyCouple();
  return useMutation({
    mutationFn: async (input: { body: string; parentId?: string | null }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid || !couple.data || !topicId) throw new Error('로그인·연결이 필요해요');
      const { error } = await supabase.from('topic_comments').insert({
        couple_id: couple.data.coupleId,
        topic_id: topicId,
        author_id: uid,
        body: input.body.trim(),
        parent_id: input.parentId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['topicComments', topicId] }),
  });
}

export interface PastTopic extends Topic {
  mine: Choice | null;
  partner: Choice | null;
}

/** 지난 주제 히스토리 (홈 하단) — 오늘 이전 seq만, 최신순 */
export function usePastTopics() {
  const session = useSession();
  const uid = session.data?.user.id;
  const couple = useMyCouple();
  const total = useTopicCount();
  const createdAt = couple.data?.createdAt;
  const count = total.data ?? 0;
  const todaySeq = createdAt && count > 0
    ? topicSeqForDay(toKSTDate(new Date(createdAt)), todayKST(), count)
    : null;

  return useQuery({
    enabled: todaySeq !== null && !!uid,
    queryKey: ['pastTopics', todaySeq],
    queryFn: async (): Promise<PastTopic[]> => {
      const { data, error } = await supabase
        .from('topics')
        .select('id, seq, question, option_a, option_b, topic_votes(user_id, choice)')
        .lt('seq', todaySeq!)
        .order('seq', { ascending: false });
      if (error) throw error;
      return data.map((t) => ({
        id: t.id,
        seq: t.seq,
        question: t.question,
        optionA: t.option_a,
        optionB: t.option_b,
        mine: (t.topic_votes?.find((v) => v.user_id === uid)?.choice as Choice) ?? null,
        partner: (t.topic_votes?.find((v) => v.user_id !== uid)?.choice as Choice) ?? null,
      }));
    },
  });
}

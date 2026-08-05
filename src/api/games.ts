import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useSession } from './auth';
import { useMyCouple } from './couple';
import { addDays, todayKST, type ISODate } from '@/lib/date';
import { pickTodayGame, weekBounds, type DailyResult, type GameDef } from '@/lib/games';

export interface Score {
  userId: string;
  bestScore: number;
  attempts: number;
  /** 회차별 원점수 — 1차부터 순서대로 */
  rounds: number[];
}

/** game_scores 한 행 → Score. numeric은 문자열로 내려올 수 있어 Number로 좁힌다 */
function toScore(r: {
  user_id: string;
  best_score: number;
  attempts: number;
  scores: number[] | null;
}): Score {
  return {
    userId: r.user_id,
    bestScore: Number(r.best_score),
    attempts: r.attempts,
    rounds: (r.scores ?? []).map(Number),
  };
}

/** 오늘의 내/상대 점수. 상대는 RLS 때문에 내가 마치기 전엔 아예 안 온다(null) */
export function useTodayGameScores() {
  const session = useSession();
  const uid = session.data?.user.id ?? '';
  const today = todayKST();
  return useQuery({
    queryKey: ['gameScores', today, uid],
    enabled: !!uid,
    queryFn: async (): Promise<{ mine: Score | null; partner: Score | null }> => {
      const { data, error } = await supabase
        .from('game_scores')
        .select('user_id, best_score, attempts, scores')
        .eq('game_date', today);
      if (error) throw error;
      const rows = (data ?? []).map(toScore);
      return {
        mine: rows.find((r) => r.userId === uid) ?? null,
        partner: rows.find((r) => r.userId !== uid) ?? null,
      };
    },
  });
}

/** 이번 주(월~일) 전적용 원자료 — 날짜별 나/상대 점수 + 그날 종목의 방향 */
export function useWeekOutcomes() {
  const session = useSession();
  const uid = session.data?.user.id ?? '';
  const { start, end } = weekBounds(todayKST());
  return useQuery({
    queryKey: ['gameWeek', start, uid],
    enabled: !!uid,
    queryFn: async (): Promise<DailyResult[]> => {
      const { data, error } = await supabase
        .from('game_scores')
        .select('game_date, user_id, best_score')
        .gte('game_date', start)
        .lte('game_date', end);
      if (error) throw error;
      const byDate = new Map<string, { mine: number | null; theirs: number | null }>();
      for (const r of data ?? []) {
        const slot = byDate.get(r.game_date) ?? { mine: null, theirs: null };
        if (r.user_id === uid) slot.mine = Number(r.best_score);
        else slot.theirs = Number(r.best_score);
        byDate.set(r.game_date, slot);
      }
      return [...byDate.entries()].map(([date, s]) => ({
        date,
        mine: s.mine,
        theirs: s.theirs,
        higherIsBetter: pickTodayGame(date).higherIsBetter,
      }));
    },
  });
}

/** 한 판 제출 — 서버(RPC)가 best·3판 상한을 강제. 상한 도달 시 null */
export function useSubmitRound() {
  const qc = useQueryClient();
  const today = todayKST();
  const game = pickTodayGame(today);

  return useMutation({
    mutationFn: async (score: number): Promise<{ attempts: number; best: number } | null> => {
      const { data, error } = await supabase.rpc('submit_game_round', {
        p_game_key: game.key,
        p_score: score,
        p_higher_is_better: game.higherIsBetter,
        p_date: today,
      });
      if (error) throw error;
      if (!data) return null; // where attempts < 3 → 0행 = 상한 도달
      return { attempts: data.attempts, best: Number(data.best_score) };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['gameScores'] });
      qc.invalidateQueries({ queryKey: ['gameWeek'] });
      // 그날 첫 완료면 상대에게 알림 (부가물 — 실패해도 게임엔 영향 없음)
      if (res?.attempts === 1) {
        supabase.functions.invoke('notify-game').catch(() => {});
      }
      // 첫 판을 마치는 순간 그날 댓글이 RLS에서 열린다
      qc.invalidateQueries({ queryKey: ['gameComments'] });
    },
  });
}

export interface GameComment {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
}

/** 그날 스레드 — 내가 그날 한 판도 안 했으면 RLS가 상대 것을 걸러 빈 배열에 가깝게 온다 */
export function useGameComments(date: ISODate) {
  return useQuery({
    queryKey: ['gameComments', date],
    queryFn: async (): Promise<GameComment[]> => {
      const { data, error } = await supabase
        .from('game_comments')
        .select('id, author_id, body, created_at')
        .eq('game_date', date)
        .order('created_at');
      if (error) throw error;
      return (data ?? []).map(toComment);
    },
  });
}

function toComment(r: {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
}): GameComment {
  return { id: r.id, authorId: r.author_id, body: r.body, createdAt: r.created_at };
}

/** 지난 날에도 쓸 수 있다 — 그날 플레이했다면 RLS가 통과시킨다 */
export function useAddGameComment() {
  const qc = useQueryClient();
  const couple = useMyCouple();
  return useMutation({
    mutationFn: async (input: { date: ISODate; body: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid || !couple.data) throw new Error('로그인·연결이 필요해요');
      const { error } = await supabase.from('game_comments').insert({
        couple_id: couple.data.coupleId,
        game_date: input.date,
        author_id: uid,
        body: input.body.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gameComments'] });
      qc.invalidateQueries({ queryKey: ['pastGames'] });
    },
  });
}

export function useDeleteGameComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from('game_comments').delete().eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gameComments'] });
      qc.invalidateQueries({ queryKey: ['pastGames'] });
    },
  });
}

export interface PastGameDay {
  date: ISODate;
  game: GameDef;
  mine: Score | null;
  partner: Score | null;
  comments: GameComment[];
}

/**
 * 오늘 이전 `days`일치 — 점수와 댓글을 한 번에 받아 날짜별로 묶는다.
 * 한쪽이라도 기록이 있는 날만, 최신순. 종목은 날짜로 결정되므로 저장값이 아니라 계산으로 채운다.
 */
export function usePastGames(days: number) {
  const session = useSession();
  const uid = session.data?.user.id ?? '';
  const today = todayKST();
  const from = addDays(today, -days);
  const to = addDays(today, -1);

  return useQuery({
    queryKey: ['pastGames', today, days, uid],
    enabled: !!uid,
    queryFn: async (): Promise<PastGameDay[]> => {
      const [scores, comments] = await Promise.all([
        supabase
          .from('game_scores')
          .select('game_date, user_id, best_score, attempts, scores')
          .gte('game_date', from)
          .lte('game_date', to),
        supabase
          .from('game_comments')
          .select('id, game_date, author_id, body, created_at')
          .gte('game_date', from)
          .lte('game_date', to)
          .order('created_at'),
      ]);
      if (scores.error) throw scores.error;
      if (comments.error) throw comments.error;

      const byDate = new Map<ISODate, PastGameDay>();
      const dayOf = (date: ISODate): PastGameDay => {
        let d = byDate.get(date);
        if (!d) {
          d = { date, game: pickTodayGame(date), mine: null, partner: null, comments: [] };
          byDate.set(date, d);
        }
        return d;
      };

      for (const r of scores.data ?? []) {
        const d = dayOf(r.game_date);
        if (r.user_id === uid) d.mine = toScore(r);
        else d.partner = toScore(r);
      }
      for (const c of comments.data ?? []) {
        dayOf(c.game_date).comments.push(toComment(c));
      }

      return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
    },
  });
}

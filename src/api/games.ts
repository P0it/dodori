import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useSession } from './auth';
import { todayKST } from '@/lib/date';
import { pickTodayGame, weekBounds, type DailyResult } from '@/lib/games';

export interface Score {
  userId: string;
  bestScore: number;
  attempts: number;
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
        .select('user_id, best_score, attempts')
        .eq('game_date', today);
      if (error) throw error;
      const rows = (data ?? []).map((r) => ({
        userId: r.user_id,
        bestScore: Number(r.best_score),
        attempts: r.attempts,
      }));
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
    },
  });
}

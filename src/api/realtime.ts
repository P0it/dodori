import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useMyCouple } from './couple';

/**
 * 커플 데이터 Realtime 구독 (§7.5): events·tracks·photos·notes 변경 시 캐시 무효화.
 * 루트 레이아웃에서 1회 구독 — 상대 변경 즉시 반영, 충돌은 last-write-wins.
 */
export function useCoupleRealtime() {
  const qc = useQueryClient();
  const couple = useMyCouple();
  const coupleId = couple.data?.coupleId;

  useEffect(() => {
    if (!coupleId) return;
    const filter = `couple_id=eq.${coupleId}`;
    let builder = supabase
      .channel(`couple-${coupleId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter }, () =>
        qc.invalidateQueries({ queryKey: ['events'] }),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tracks', filter }, () => {
        qc.invalidateQueries({ queryKey: ['tracks'] });
        qc.invalidateQueries({ queryKey: ['track'] });
      })
      // photos·notes는 couple_id 컬럼이 없어 트랙 무효화로 커버 (변경 빈도상 충분)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, () => {
        qc.invalidateQueries({ queryKey: ['track'] });
        qc.invalidateQueries({ queryKey: ['tracks'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () =>
        qc.invalidateQueries({ queryKey: ['track'] }),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'anniversaries', filter }, () =>
        qc.invalidateQueries({ queryKey: ['anniversaries'] }),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts', filter }, () =>
        qc.invalidateQueries({ queryKey: ['posts'] }),
      )
      // 상대가 투표하면 내 표도 잠긴다 — 그 순간을 놓치면 수정 버튼이 열린 채로 남는다
      .on('postgres_changes', { event: '*', schema: 'public', table: 'topic_votes', filter }, () => {
        qc.invalidateQueries({ queryKey: ['topicVotes'] });
        qc.invalidateQueries({ queryKey: ['pastTopics'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stories', filter }, () => {
        qc.invalidateQueries({ queryKey: ['stories'] });
        // 그날 앨범이 스토리 사진을 품는다 — 트랙 상세도 같이 갱신
        qc.invalidateQueries({ queryKey: ['track'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'story_reactions' }, () =>
        qc.invalidateQueries({ queryKey: ['stories'] }),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'story_comments' }, () =>
        qc.invalidateQueries({ queryKey: ['stories'] }),
      )
      // 상대가 오늘의 게임을 마치면 그 순간 점수가 열린다 — 홈 카드가 잠긴 채 남지 않게
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_scores', filter }, () => {
        qc.invalidateQueries({ queryKey: ['gameScores'] });
        qc.invalidateQueries({ queryKey: ['gameWeek'] });
        // 상대가 마치면 그날 댓글도 같이 열린다
        qc.invalidateQueries({ queryKey: ['gameComments'] });
        qc.invalidateQueries({ queryKey: ['pastGames'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_comments', filter }, () => {
        qc.invalidateQueries({ queryKey: ['gameComments'] });
        qc.invalidateQueries({ queryKey: ['pastGames'] });
      })
      // post_reactions·post_comments는 couple_id 컬럼이 없어 필터 없이 구독 (photos·notes와 동일)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_reactions' }, () =>
        qc.invalidateQueries({ queryKey: ['posts'] }),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments' }, () =>
        qc.invalidateQueries({ queryKey: ['posts'] }),
      );

    // 구독이 실제로 붙는지·이벤트가 도착하는지 눈으로 보기 위한 계측 (개발 빌드 전용).
    // RLS가 막으면 이벤트 자체가 안 온다 — 조용한 실패라 로그 없이는 구분이 안 된다.
    if (__DEV__) {
      builder = builder.on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload: { table: string; eventType: string }) =>
          console.log('[realtime] 수신', payload.table, payload.eventType),
      );
    }

    const channel = builder.subscribe((status, err) => {
      if (__DEV__) console.log('[realtime] 구독', status, err?.message ?? '');
    });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, qc]);
}

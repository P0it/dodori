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
    const channel = supabase
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
      // post_reactions·post_comments는 couple_id 컬럼이 없어 필터 없이 구독 (photos·notes와 동일)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_reactions' }, () =>
        qc.invalidateQueries({ queryKey: ['posts'] }),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments' }, () =>
        qc.invalidateQueries({ queryKey: ['posts'] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, qc]);
}

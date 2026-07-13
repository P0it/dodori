/**
 * 오늘의 대화주제 배정 — 커플별 순차.
 * 배정 테이블도 cron도 없다: 커플이 만들어진 날부터 며칠 지났는지가 곧 주제 번호다.
 */
import { diffDays, type ISODate } from './date';

/** 커플 생성일 = 1번 주제. 시드를 다 쓰면 처음으로 돌아온다. */
export function topicSeqForDay(
  coupleCreatedAt: ISODate,
  today: ISODate,
  topicCount: number,
): number {
  const elapsed = diffDays(coupleCreatedAt, today);
  return (elapsed % topicCount) + 1;
}

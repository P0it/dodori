/**
 * 기념일 자동 생성 계산 (PRD §7.1)
 * 연결 완료 시 Edge Function이 이 규칙으로 생성: 100/200/300일(1회) + 주년·생일(repeat_yearly)
 * 연로은 "다음 발생일"을 클라이언트가 산출 (매년 행 생성 안 함)
 */
import { addDays, daysInMonth, diffDays, todayKST, type ISODate } from './date';

export type AnnivType = 'd100' | 'd200' | 'd300' | 'yearly' | 'birthday' | 'custom';

export interface AnnivSpec {
  type: AnnivType;
  label: string;
  date: ISODate;
  repeatYearly: boolean;
}

/**
 * n일째 기념일 날짜. 시작일 = 1일째 관례이므로 100일째 = start + 99일.
 */
export function nthDayAnniversary(startedAt: ISODate, n: number): ISODate {
  return addDays(startedAt, n - 1);
}

/** 주년 날짜 (시작일의 y년 후 같은 날, 2/29는 2/28로 보정) */
export function yearlyAnniversary(startedAt: ISODate, yearsAfter: number): ISODate {
  const [y, m, d] = startedAt.split('-').map(Number);
  const ty = y + yearsAfter;
  const td = Math.min(d, daysInMonth(ty, m));
  return `${ty}-${String(m).padStart(2, '0')}-${String(td).padStart(2, '0')}`;
}

/** 연결 완료 시 자동 생성될 기념일 세트 (Edge Function과 동일 규칙, 단위 테스트 대상) */
export function buildAutoAnniversaries(
  startedAt: ISODate,
  birthdays: { label: string; date: ISODate }[],
): AnnivSpec[] {
  return [
    { type: 'd100', label: '100일', date: nthDayAnniversary(startedAt, 100), repeatYearly: false },
    { type: 'd200', label: '200일', date: nthDayAnniversary(startedAt, 200), repeatYearly: false },
    { type: 'd300', label: '300일', date: nthDayAnniversary(startedAt, 300), repeatYearly: false },
    { type: 'yearly', label: '1주년', date: yearlyAnniversary(startedAt, 1), repeatYearly: true },
    ...birthdays.map((b) => ({
      type: 'birthday' as const,
      label: b.label,
      date: b.date,
      repeatYearly: true,
    })),
  ];
}

/**
 * repeat_yearly 기념일의 다음 발생일 (오늘 포함 이후 가장 가까운 발생).
 * 예: 생일 03-22, 오늘 07-08 → 내년 03-22
 */
export function nextOccurrence(anchor: ISODate, now: Date = new Date()): ISODate {
  const today = todayKST(now);
  const [, m, d] = anchor.split('-').map(Number);
  const [ty] = today.split('-').map(Number);
  for (let y = ty; ; y++) {
    const td = Math.min(d, daysInMonth(y, m));
    const candidate = `${y}-${String(m).padStart(2, '0')}-${String(td).padStart(2, '0')}`;
    if (diffDays(today, candidate) >= 0) return candidate;
  }
}

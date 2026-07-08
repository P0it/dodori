/**
 * 날짜 유틸 — 모든 연산 Asia/Seoul(KST, UTC+9) 고정. (PRD §7.2, §9)
 * 기기 로컬 타임존과 무관하게 동작해야 한다. UTC 자정 경계 버그 주의.
 *
 * "날짜"는 항상 'YYYY-MM-DD' 문자열(ISO date)로 다룬다 — DB date 컬럼과 1:1.
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export type ISODate = string; // 'YYYY-MM-DD'

/** ISO date 문자열 검증 */
export function isISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  if (m < 1 || m > 12) return false;
  return d >= 1 && d <= daysInMonth(y, m);
}

export function daysInMonth(year: number, month: number): number {
  // month: 1~12
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Date(절대 시각) → KST 기준 ISO date */
export function toKSTDate(at: Date): ISODate {
  const t = new Date(at.getTime() + KST_OFFSET_MS);
  const y = t.getUTCFullYear();
  const m = String(t.getUTCMonth() + 1).padStart(2, '0');
  const d = String(t.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 오늘 (KST) */
export function todayKST(now: Date = new Date()): ISODate {
  return toKSTDate(now);
}

/** ISO date → epoch day (KST 자정 기준 일 수). 날짜 간 산술의 기반 */
export function toEpochDay(date: ISODate): number {
  const [y, m, d] = date.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** epoch day → ISO date */
export function fromEpochDay(epochDay: number): ISODate {
  const t = new Date(epochDay * 86_400_000);
  const y = t.getUTCFullYear();
  const m = String(t.getUTCMonth() + 1).padStart(2, '0');
  const d = String(t.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 날짜 더하기 */
export function addDays(date: ISODate, days: number): ISODate {
  return fromEpochDay(toEpochDay(date) + days);
}

/** b - a (일 수) */
export function diffDays(a: ISODate, b: ISODate): number {
  return toEpochDay(b) - toEpochDay(a);
}

/**
 * released 판정 (PRD §7.2): date < today(KST) → released.
 * 상태 컬럼 없이 읽기 시점 파생. 당일은 아직 upcoming (00:05 발매 푸시와 별개).
 */
export function isReleased(trackDate: ISODate, now: Date = new Date()): boolean {
  return toEpochDay(trackDate) < toEpochDay(todayKST(now));
}

/**
 * D-day 계산: 대상일 - 오늘.
 * 반환 0 = 오늘(D-Day), 양수 = D-n (남음), 음수 = D+n (지남)
 */
export function dday(target: ISODate, now: Date = new Date()): number {
  return diffDays(todayKST(now), target);
}

/** D-day 표기 문자열: 'D-3' | 'D-Day' | 'D+5' */
export function formatDday(target: ISODate, now: Date = new Date()): string {
  const n = dday(target, now);
  if (n === 0) return 'D-Day';
  return n > 0 ? `D-${n}` : `D+${-n}`;
}

/** 시작일로부터 n일째 (시작일 = 1일째, 국내 관례) */
export function daysSince(startedAt: ISODate, now: Date = new Date()): number {
  return diffDays(startedAt, todayKST(now)) + 1;
}

/** 'YYYY-MM' (월 플레이리스트 키) */
export function monthKey(date: ISODate): string {
  return date.slice(0, 7);
}

/**
 * 월간 캘린더 그리드 계산 (PRD §3 자체 구현, 일요일 시작 — 목업 기준)
 * 순수 함수만 — 화면은 이 셀 배열을 그대로 렌더한다.
 */
import { daysInMonth, todayKST, type ISODate } from './date';

export interface MonthKeyParts {
  year: number;
  month: number; // 1~12
}

/** 'YYYY-MM' ↔ parts */
export function parseMonthKey(key: string): MonthKeyParts {
  const [y, m] = key.split('-').map(Number);
  return { year: y, month: m };
}
export function toMonthKeyString(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** n개월 이동 */
export function addMonths(key: string, delta: number): string {
  const { year, month } = parseMonthKey(key);
  const idx = year * 12 + (month - 1) + delta;
  return toMonthKeyString(Math.floor(idx / 12), (idx % 12) + 1);
}

/** 해당 월 1일의 요일 (0=일) — KST 무관, 그레고리력 계산 */
export function firstWeekday(year: number, month: number): number {
  return new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
}

export interface DayCell {
  date: ISODate;
  day: number;
  inMonth: boolean;
  weekday: number; // 0=일 ~ 6=토
  isToday: boolean;
}

/**
 * 월간 그리드 셀 — 앞뒤 달 채움 포함, 7의 배수(4~6주) 길이.
 * 목업(17)은 필요한 주만 렌더하므로 고정 6주가 아니라 실제 주 수만 반환한다.
 */
export function monthCells(key: string, now: Date = new Date()): DayCell[] {
  const { year, month } = parseMonthKey(key);
  const lead = firstWeekday(year, month);
  const dim = daysInMonth(year, month);
  const weeks = Math.ceil((lead + dim) / 7);
  const today = todayKST(now);

  const cells: DayCell[] = [];
  // 이전 달 꼬리
  const prev = addMonths(key, -1);
  const { year: py, month: pm } = parseMonthKey(prev);
  const pdim = daysInMonth(py, pm);
  for (let i = 0; i < lead; i++) {
    const d = pdim - lead + 1 + i;
    cells.push(makeCell(py, pm, d, false, today));
  }
  // 이번 달
  for (let d = 1; d <= dim; d++) cells.push(makeCell(year, month, d, true, today));
  // 다음 달 머리
  const next = addMonths(key, 1);
  const { year: ny, month: nm } = parseMonthKey(next);
  for (let d = 1; cells.length < weeks * 7; d++) cells.push(makeCell(ny, nm, d, false, today));

  return cells;
}

function makeCell(year: number, month: number, day: number, inMonth: boolean, today: ISODate): DayCell {
  const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return {
    date,
    day,
    inMonth,
    weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
    isToday: date === today,
  };
}

/** 월 표시 라벨: '7월', '2026' */
export function monthLabel(key: string): { month: string; year: string } {
  const { year, month } = parseMonthKey(key);
  return { month: `${month}월`, year: String(year) };
}

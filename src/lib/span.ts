/**
 * 여러 날에 걸친 일정을 월간 그리드 위 막대로 옮기는 계산 — 순수 함수.
 * 그리드는 7열 × N주이고, 한 일정이 주 경계를 넘으면 주마다 막대가 하나씩 끊긴다.
 */
import { addDays, toEpochDay, toKSTDate, type ISODate } from './date';

/**
 * 일정이 걸친 날짜 구간 (KST 기준, 양끝 포함). ends_at이 없으면 하루짜리다.
 * 여러 날 종일 일정은 ends_at을 마지막 날 23:59로 저장하므로 그 날까지 포함된다.
 */
export function eventDayRange(startsAt: string, endsAt: string | null): { from: ISODate; to: ISODate } {
  const from = toKSTDate(new Date(startsAt));
  const to = endsAt ? toKSTDate(new Date(endsAt)) : from;
  // 뒤집힌 데이터(과거 버그 등)는 하루짜리로 접어 그리드가 깨지지 않게 한다
  return { from, to: to < from ? from : to };
}

/** 한 주 안에서 이어지는 막대 한 토막 */
export interface SpanSegment {
  /** 몇 번째 주 행인가 (0-based) */
  week: number;
  /** 그 주 안에서 시작·끝 열 (0=일 ~ 6=토, 양끝 포함) */
  startCol: number;
  endCol: number;
  /** 이 토막 왼쪽/오른쪽으로 일정이 더 이어지는가 — 끝을 둥글게 할지 자를지 */
  continuesLeft: boolean;
  continuesRight: boolean;
}

/** 하루짜리도 길이 1의 구간이다 — 여러 날 판정은 호출부의 몫 */
export function daySpan(from: ISODate, to: ISODate): number {
  return toEpochDay(to) - toEpochDay(from) + 1;
}

/** 시작~종료(양끝 포함) 날짜 목록. 뒤집힌 구간은 빈 배열 */
export function spanDays(from: ISODate, to: ISODate): ISODate[] {
  const n = daySpan(from, to);
  if (n < 1) return [];
  return Array.from({ length: n }, (_, i) => addDays(from, i));
}

/**
 * 그리드(7의 배수 길이) 위에서 [from, to] 구간이 차지하는 주별 토막.
 * 그리드 밖으로 삐져나간 부분은 잘라내되, 잘렸다는 사실은 continues*로 남긴다.
 */
export function spanSegments(gridDates: ISODate[], from: ISODate, to: ISODate): SpanSegment[] {
  if (gridDates.length === 0 || daySpan(from, to) < 1) return [];

  const gridStart = toEpochDay(gridDates[0]);
  const gridEnd = toEpochDay(gridDates[gridDates.length - 1]);
  const start = toEpochDay(from);
  const end = toEpochDay(to);
  if (end < gridStart || start > gridEnd) return [];

  // 그리드 안으로 자른 구간 — 잘린 쪽은 막대 끝을 열어둔다
  const clippedStart = Math.max(start, gridStart);
  const clippedEnd = Math.min(end, gridEnd);

  const segments: SpanSegment[] = [];
  const firstWeek = Math.floor((clippedStart - gridStart) / 7);
  const lastWeek = Math.floor((clippedEnd - gridStart) / 7);

  for (let week = firstWeek; week <= lastWeek; week++) {
    const weekStart = gridStart + week * 7;
    const segStart = Math.max(clippedStart, weekStart);
    const segEnd = Math.min(clippedEnd, weekStart + 6);
    segments.push({
      week,
      startCol: segStart - weekStart,
      endCol: segEnd - weekStart,
      continuesLeft: start < segStart,
      continuesRight: end > segEnd,
    });
  }
  return segments;
}

/**
 * 막대끼리 겹치지 않게 세로 칸(lane)을 배정한다. 주마다 따로 세며,
 * 같은 일정이 여러 주에 걸쳐도 주마다 다른 칸에 앉을 수 있다 (칸을 아끼는 쪽을 택했다).
 * 입력 순서가 우선순위 — 호출부가 시작일·길이로 미리 정렬해 넘긴다.
 */
export function assignLanes<T>(
  items: { key: string; segments: SpanSegment[]; value: T }[],
): { key: string; value: T; segment: SpanSegment; lane: number }[] {
  /** week → lane → 그 칸이 이미 찬 열들 */
  const taken = new Map<number, boolean[][]>();
  const out: { key: string; value: T; segment: SpanSegment; lane: number }[] = [];

  for (const item of items) {
    for (const segment of item.segments) {
      const lanes = taken.get(segment.week) ?? [];
      let lane = lanes.findIndex((cols) => {
        for (let c = segment.startCol; c <= segment.endCol; c++) if (cols[c]) return false;
        return true;
      });
      if (lane === -1) {
        lane = lanes.length;
        lanes.push(new Array(7).fill(false));
      }
      for (let c = segment.startCol; c <= segment.endCol; c++) lanes[lane][c] = true;
      taken.set(segment.week, lanes);
      out.push({ key: item.key, value: item.value, segment, lane });
    }
  }
  return out;
}

/** 주별 막대 칸 수 — 셀 안 마커를 그만큼 아래로 밀어야 한다 */
export function laneCounts(
  placed: { segment: SpanSegment; lane: number }[],
  weeks: number,
): number[] {
  const counts = new Array(weeks).fill(0);
  for (const p of placed) counts[p.segment.week] = Math.max(counts[p.segment.week], p.lane + 1);
  return counts;
}

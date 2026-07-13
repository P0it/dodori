/**
 * "다음 일정" 선정 (PRD §7.6): upcoming track 최근접 1건 → 없으면 다음 기념일 → 없으면 null.
 * 앱 어디서든 이 규칙 하나만 쓴다 (NextUp 바 · 플리 루트 카드 공용).
 */
import { todayKST, type ISODate } from './date';

export interface NextUpTrack {
  kind: 'track';
  id: string;
  title: string;
  date: ISODate;
}
export interface NextUpAnniv {
  kind: 'anniv';
  id: string;
  label: string;
  date: ISODate;
}
export type NextUpPick = NextUpTrack | NextUpAnniv | null;

export function pickNextUp(
  tracks: { id: string; title: string; date: ISODate }[],
  annivs: { id: string; label: string; nextDate: ISODate }[],
  now: Date = new Date(),
): NextUpPick {
  const today = todayKST(now);
  const t = tracks
    .filter((x) => x.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  if (t) return { kind: 'track', id: t.id, title: t.title, date: t.date };
  const a = annivs
    .filter((x) => x.nextDate >= today)
    .sort((x, y) => x.nextDate.localeCompare(y.nextDate))[0];
  if (a) return { kind: 'anniv', id: a.id, label: a.label, date: a.nextDate };
  return null;
}


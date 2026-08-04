/**
 * 하루 안의 시각 유틸 — 'HH:mm' 문자열로만 다룬다. 날짜와 무관하므로 타임존 개념이 없다
 * (날짜와 붙여 timestamptz로 만드는 건 api/events.ts의 몫).
 */

export type HHmm = string; // '19:00'

export const MINUTE_STEP = 5;

export function isHHmm(s: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

/** 'HH:mm' → 0시부터의 분. 형식이 깨졌으면 null */
export function toMinutes(t: HHmm): number | null {
  if (!isHHmm(t)) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** 분 → 'HH:mm'. 하루를 넘기거나 음수면 하루 안으로 감는다 */
export function fromMinutes(min: number): HHmm {
  const wrapped = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** 시각 이동. 하루를 넘기면 감긴다 — 종료 시각 자동 제안에 쓴다 */
export function addHours(t: HHmm, hours: number): HHmm {
  const min = toMinutes(t);
  return min === null ? t : fromMinutes(min + hours * 60);
}

/**
 * 휠이 고를 수 있는 눈금으로 내림 — 서버에 이미 들어있는 19:23 같은 값도
 * 휠에 얹으려면 칸에 맞아야 한다. 형식이 깨졌으면 그대로 돌려준다.
 */
export function snapMinute(t: HHmm, step: number = MINUTE_STEP): HHmm {
  const min = toMinutes(t);
  if (min === null) return t;
  return fromMinutes(Math.floor(min / step) * step);
}

/** 휠 분 칸 — [0, 5, 10, …] */
export function minuteOptions(step: number = MINUTE_STEP): number[] {
  return Array.from({ length: 60 / step }, (_, i) => i * step);
}

/** 같은 날 안에서 end가 start보다 뒤인가 — 일정은 날짜를 넘기지 않는다 */
export function isAfter(start: HHmm, end: HHmm): boolean {
  const a = toMinutes(start);
  const b = toMinutes(end);
  return a !== null && b !== null && b > a;
}

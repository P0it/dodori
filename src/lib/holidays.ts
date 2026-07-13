/**
 * 한국 공휴일 — 「공휴일에 관한 법률」 및 시행령 기준. (PRD §7.2 스타일: 상태 컬럼 없이 규칙으로 파생)
 *
 * 데이터를 박아두지 않고 규칙으로 계산한다:
 *  - 양력 고정 공휴일 8종 → 상수 규칙
 *  - 음력 3종(설날·부처님오신날·추석) → KASI 음양력 변환표(korean-lunar-calendar, 2050년까지)
 *  - 대체공휴일 → 시행령 규칙. "그 공휴일 다음의 첫 번째 비공휴일" (항상 뒤로만 민다)
 *
 * 계산 불가능한 것은 임시공휴일·선거일뿐이며, 이는 서버(holidays_extra)에서 오버레이한다.
 */
import KoreanLunarCalendar from 'korean-lunar-calendar';
import { addDays, type ISODate } from './date';

export interface Holiday {
  date: ISODate;
  name: string;
  /** 대체공휴일 여부 */
  substitute: boolean;
}

/** 양력 고정 공휴일 — [월, 일, 이름] */
const SOLAR: [number, number, string][] = [
  [1, 1, '신정'],
  [3, 1, '삼일절'],
  [5, 5, '어린이날'],
  [6, 6, '현충일'],
  [8, 15, '광복절'],
  [10, 3, '개천절'],
  [10, 9, '한글날'],
  [12, 25, '성탄절'],
];

/**
 * 대체공휴일 발동 조건 (시행령 제3조).
 *  - 'weekend'      : 토요일·일요일과 겹칠 때
 *  - 'weekendOrDup' : 토·일 또는 다른 공휴일과 겹칠 때 (어린이날)
 *  - 'sundayOrDup'  : 일요일 또는 다른 공휴일과 겹칠 때 — 토요일은 제외 (설날·추석 연휴)
 * 신정·현충일은 대체공휴일이 없어 여기에 없다.
 */
type SubRule = 'weekend' | 'weekendOrDup' | 'sundayOrDup';

const SUB_RULES: Record<string, SubRule> = {
  삼일절: 'weekend',
  광복절: 'weekend',
  개천절: 'weekend',
  한글날: 'weekend',
  부처님오신날: 'weekend',
  성탄절: 'weekend',
  어린이날: 'weekendOrDup',
  설날: 'sundayOrDup',
  추석: 'sundayOrDup',
};

/** 음력 → 양력 (KASI 표준). 범위 밖이면 null */
function fromLunar(year: number, month: number, day: number): ISODate | null {
  const cal = new KoreanLunarCalendar();
  if (!cal.setLunarDate(year, month, day, false)) return null;
  const s = cal.getSolarCalendar();
  return `${s.year}-${String(s.month).padStart(2, '0')}-${String(s.day).padStart(2, '0')}`;
}

function weekday(date: ISODate): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=일, 6=토
}

/** 대체공휴일을 붙일 "그룹" — 설날·추석은 연휴 3일이 한 그룹, 나머지는 하루 */
interface Group {
  name: string;
  days: ISODate[];
}

function groupsOf(year: number): Group[] {
  const groups: Group[] = [];

  for (const [m, d, name] of SOLAR) {
    groups.push({ name, days: [`${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`] });
  }

  const buddha = fromLunar(year, 4, 8);
  if (buddha) groups.push({ name: '부처님오신날', days: [buddha] });

  // 설날·추석은 당일 앞뒤 하루씩 총 3일이 공휴일
  const seollal = fromLunar(year, 1, 1);
  if (seollal) groups.push({ name: '설날', days: [addDays(seollal, -1), seollal, addDays(seollal, 1)] });

  const chuseok = fromLunar(year, 8, 15);
  if (chuseok) groups.push({ name: '추석', days: [addDays(chuseok, -1), chuseok, addDays(chuseok, 1)] });

  return groups.sort((a, b) => (a.days[0] < b.days[0] ? -1 : 1));
}

/**
 * 해당 연도의 공휴일 전체 (대체공휴일 포함), 날짜 오름차순.
 * 설날 전날이 전년 12월로 넘어가는 해가 있어 year 밖의 날짜가 섞일 수 있다 — 의도된 동작.
 */
export function holidaysInYear(year: number): Holiday[] {
  const groups = groupsOf(year);

  // 대체공휴일 판정 전의 "본 공휴일" 집합
  const base = new Map<ISODate, string>();
  for (const g of groups) {
    for (const d of g.days) {
      // 이미 다른 공휴일이 선점한 날 = "다른 공휴일과 겹침"
      if (!base.has(d)) base.set(d, g.name);
    }
  }

  const out = new Map<ISODate, Holiday>();
  for (const [date, name] of base) out.set(date, { date, name, substitute: false });

  // 그룹을 날짜순으로 돌며 대체공휴일을 뒤로 밀어 배정한다.
  // 앞선 그룹이 만든 대체공휴일도 "공휴일"이므로 뒤 그룹의 배정 대상에서 제외된다.
  for (const g of groups) {
    const rule = SUB_RULES[g.name];
    if (!rule) continue;

    let triggers = 0;
    for (const d of g.days) {
      const w = weekday(d);
      const dup = base.get(d) !== g.name; // 다른 공휴일이 선점 → 겹침
      const hit =
        rule === 'weekend'
          ? w === 0 || w === 6
          : rule === 'weekendOrDup'
            ? w === 0 || w === 6 || dup
            : w === 0 || dup; // sundayOrDup — 토요일은 대체 없음
      if (hit) triggers++;
    }
    if (triggers === 0) continue;

    // 겹친 수만큼, 연휴 마지막 날 다음의 "첫 번째 비공휴일"부터 차례로 배정.
    // 비공휴일 = 토·일도 아니고 이미 공휴일(대체 포함)도 아닌 날.
    let cursor = g.days[g.days.length - 1];
    for (let i = 0; i < triggers; i++) {
      do {
        cursor = addDays(cursor, 1);
      } while (weekday(cursor) === 0 || weekday(cursor) === 6 || out.has(cursor));
      out.set(cursor, { date: cursor, name: `대체공휴일(${g.name})`, substitute: true });
    }
  }

  return [...out.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** 셀에 들어갈 짧은 표기 — 캘린더 한 칸은 좁다 ('대체공휴일(광복절)' → '대체') */
export function shortHolidayName(name: string): string {
  if (name.startsWith('대체공휴일')) return '대체';
  if (name === '부처님오신날') return '부처님';
  return name;
}

/** 해당 연도의 공휴일 조회 맵 (date → 이름). 화면에서 쓰기 좋은 형태 */
export function holidayMap(year: number): Record<ISODate, string> {
  const map: Record<ISODate, string> = {};
  for (const h of holidaysInYear(year)) map[h.date] = h.name;
  return map;
}

/**
 * 월간 그리드용 — 'YYYY-MM' 그리드는 앞뒤 달을 물고 있으므로 전후 연도까지 합친다.
 * extra: 서버에서 내려온 임시공휴일·선거일 (date → 이름) 오버레이
 */
export function holidayMapForMonth(
  monthKey: string,
  extra: Record<ISODate, string> = {},
): Record<ISODate, string> {
  const year = Number(monthKey.slice(0, 4));
  return {
    ...holidayMap(year - 1),
    ...holidayMap(year),
    ...holidayMap(year + 1),
    ...extra,
  };
}

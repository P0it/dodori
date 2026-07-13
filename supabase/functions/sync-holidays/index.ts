// sync-holidays — 월 1회 cron. KASI(한국천문연구원) 특일정보 API에서 "계산 불가능한" 공휴일만 긁어온다.
//
// 일반 공휴일은 클라이언트 src/lib/holidays.ts가 규칙으로 계산하므로 여기서 다루지 않는다.
// 국무회의가 그때그때 지정하는 임시공휴일·선거일만 holidays_extra에 넣는다.
// API 키(DATA_GO_KR_KEY)는 클라이언트 노출 금지 → Edge Function 뒤에 둔다 (네이버 키와 동일 규칙).
import { adminClient, isServiceRole, json } from '../_shared/client.ts';

const ENDPOINT =
  'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo';

/** 우리가 규칙으로 계산하는 공휴일 이름 — 이건 서버에 저장하지 않는다 */
const COMPUTED = [
  '1월1일',
  '설날',
  '삼일절',
  '3·1절',
  '3ㆍ1절',
  '부처님',
  '어린이날',
  '현충일',
  '광복절',
  '추석',
  '개천절',
  '한글날',
  '기독탄신일',
  '성탄절',
  '대체공휴일',
];

/**
 * KASI가 isHoliday=Y로 주지만 관공서 공휴일(=빨간 날)이 아닌 것들.
 * 제헌절은 2008년부터 공휴일 아님, 근로자의 날은 관공서 휴일이 아니다.
 */
const NOT_RED = ['제헌절', '노동절', '근로자의 날'];

const isComputed = (name: string) => COMPUTED.some((k) => name.includes(k));
const isNotRed = (name: string) => NOT_RED.some((k) => name.includes(k));

interface KasiItem {
  dateName: string;
  isHoliday: 'Y' | 'N';
  locdate: number; // 20260603
}

async function fetchYear(key: string, year: number): Promise<KasiItem[]> {
  const url = `${ENDPOINT}?serviceKey=${key}&solYear=${year}&numOfRows=100&_type=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`KASI ${year}: HTTP ${res.status}`);
  const body = await res.json();
  const item = body?.response?.body?.items?.item;
  if (!item) return [];
  return Array.isArray(item) ? item : [item]; // 1건이면 배열이 아니라 객체로 온다
}

const toISO = (locdate: number) => {
  const s = String(locdate);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
};

Deno.serve(async (req) => {
  // service role 호출만 허용 (cron 전용)
  if (!isServiceRole(req)) return json({ error: 'forbidden' }, 403);

  const key = Deno.env.get('DATA_GO_KR_KEY');
  if (!key) return json({ error: 'DATA_GO_KR_KEY not set' }, 500);

  // KASI는 대략 1~2년치만 공표한다. 올해와 내년만 본다.
  const thisYear = new Date(Date.now() + 9 * 3600_000).getUTCFullYear();
  const years = [thisYear, thisYear + 1];

  const rows: { date: string; name: string }[] = [];
  for (const y of years) {
    for (const it of await fetchYear(key, y)) {
      if (it.isHoliday !== 'Y') continue;
      if (isComputed(it.dateName)) continue; // 규칙으로 계산되는 날 → 저장 안 함
      if (isNotRed(it.dateName)) continue; // 공휴일이 아닌 날 → 빨갛게 칠하면 안 됨
      rows.push({ date: toISO(it.locdate), name: it.dateName });
    }
  }

  const admin = adminClient();
  if (rows.length) {
    const { error } = await admin
      .from('holidays_extra')
      .upsert(rows.map((r) => ({ ...r, synced_at: new Date().toISOString() })), {
        onConflict: 'date',
      });
    if (error) return json({ error: error.message }, 500);
  }

  return json({ years, extra: rows });
});

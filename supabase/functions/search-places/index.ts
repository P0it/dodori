// search-places — 네이버 지역검색 프록시 (PRD §7.4)
// API 키는 함수 시크릿(NAVER_CLIENT_ID/SECRET)으로만 — 클라이언트 노출 금지.
// 카텍(mapx/mapy ×1e7 경위도) → WGS84 변환, 정규화 Place 반환. 저장은 클라이언트가 담을 때만.
import { callerId, json, preflight } from '../_shared/client.ts';

interface NaverItem {
  title: string;
  link: string;
  category: string;
  address: string;
  roadAddress: string;
  mapx: string; // 경도 ×1e7
  mapy: string; // 위도 ×1e7
}

const stripTags = (s: string) => s.replace(/<[^>]+>/g, '');

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  if (!(await callerId(req))) return json({ error: '로그인이 필요해요' }, 401);

  const id = Deno.env.get('NAVER_CLIENT_ID');
  const secret = Deno.env.get('NAVER_CLIENT_SECRET');
  if (!id || !secret) return json({ error: '네이버 API 키가 설정되지 않았어요' }, 503);

  let query: unknown;
  try {
    ({ query } = await req.json());
  } catch {
    return json({ error: 'invalid body' }, 400);
  }
  if (typeof query !== 'string' || !query.trim()) return json({ error: '검색어가 필요해요' }, 400);

  const url = new URL('https://openapi.naver.com/v1/search/local.json');
  url.searchParams.set('query', query.trim());
  url.searchParams.set('display', '10');

  const res = await fetch(url, {
    headers: { 'X-Naver-Client-Id': id, 'X-Naver-Client-Secret': secret },
  });
  if (!res.ok) return json({ error: `네이버 검색 실패 (${res.status})` }, 502);
  const body = (await res.json()) as { items: NaverItem[] };

  const places = body.items.map((it) => ({
    // link가 고유하지 않은 경우가 있어 이름+주소 해시 대신 link 우선, 없으면 null
    naver_id: it.link || `${stripTags(it.title)}|${it.address}`,
    name: stripTags(it.title),
    category: it.category || null,
    address: it.roadAddress || it.address || null,
    lat: it.mapy ? Number(it.mapy) / 1e7 : null,
    lng: it.mapx ? Number(it.mapx) / 1e7 : null,
    link: it.link || null,
  }));

  return json({ places });
});

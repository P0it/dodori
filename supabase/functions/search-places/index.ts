// search-places — 네이버 지역검색 프록시 (PRD §7.4)
// M3 구현 예정: 검색어 → 네이버 지역검색 API(NAVER_CLIENT_ID/SECRET) → 정규화 Place 반환
// 카텍(mapx/mapy) → WGS84 변환 포함. API 키는 절대 클라이언트에 노출하지 않는다.
Deno.serve(() =>
  new Response(JSON.stringify({ error: 'not implemented (M3)' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' },
  }),
);

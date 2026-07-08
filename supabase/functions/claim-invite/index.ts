// claim-invite — 초대 코드 수락 (PRD §7.1)
// M1 구현 예정: 코드 검증 → 멤버 2인 확정 → 코드 무효화를 단일 트랜잭션으로 (race 방지)
Deno.serve(() =>
  new Response(JSON.stringify({ error: 'not implemented (M1)' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' },
  }),
);

// daily-release — 매일 00:05 KST cron (§7.2·§7.7)
// (a) 어제 날짜 트랙 "발매" 푸시 (둘 다)  (b) 기념일 D-7/D-1 리마인드 (둘 다)
// 호출: pg_cron → net.http_post (Authorization: service role). 수동 테스트도 동일.
import { adminClient, json } from '../_shared/client.ts';

const DAY_MS = 86_400_000;

/** KST 기준 오늘 'YYYY-MM-DD' */
function kstDate(offsetDays = 0): string {
  return new Date(Date.now() + 9 * 3600_000 + offsetDays * DAY_MS).toISOString().slice(0, 10);
}

interface PushMsg {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

async function sendPushes(messages: PushMsg[]) {
  if (!messages.length) return;
  // Expo push API — 100건 단위
  for (let i = 0; i < messages.length; i += 100) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages.slice(i, i + 100)),
    });
  }
}

Deno.serve(async (req) => {
  // service role 호출만 허용 (cron 전용)
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '§')) {
    return json({ error: 'forbidden' }, 403);
  }

  const admin = adminClient();
  const today = kstDate();
  const yesterday = kstDate(-1);
  const messages: PushMsg[] = [];

  // 커플별 멤버 토큰 로더 (캐시)
  const tokenCache = new Map<string, string[]>();
  async function coupleTokens(coupleId: string): Promise<string[]> {
    if (tokenCache.has(coupleId)) return tokenCache.get(coupleId)!;
    const { data: members } = await admin
      .from('couple_members')
      .select('user_id')
      .eq('couple_id', coupleId);
    const ids = (members ?? []).map((m) => m.user_id);
    const { data: profiles } = await admin
      .from('profiles')
      .select('push_token')
      .in('id', ids)
      .not('push_token', 'is', null);
    const tokens = (profiles ?? []).map((p) => p.push_token!).filter(Boolean);
    tokenCache.set(coupleId, tokens);
    return tokens;
  }

  // (a) 어제 데이트 발매
  const { data: released } = await admin
    .from('tracks')
    .select('id, title, couple_id')
    .eq('date', yesterday);
  for (const t of released ?? []) {
    for (const to of await coupleTokens(t.couple_id)) {
      messages.push({
        to,
        title: '어제의 데이트가 발매됐어요 🎧',
        body: `${t.title} — 사진을 올려 트랙을 완성해보세요`,
        data: { url: `/track/${t.id}` },
      });
    }
  }

  // (b) 기념일 D-7 / D-1 (repeat_yearly는 월·일 매칭)
  const targets: { date: string; dday: string }[] = [
    { date: kstDate(7), dday: 'D-7' },
    { date: kstDate(1), dday: 'D-1' },
  ];
  const { data: annivs } = await admin
    .from('anniversaries')
    .select('id, label, date, repeat_yearly, couple_id');
  for (const a of annivs ?? []) {
    for (const t of targets) {
      const hit = a.repeat_yearly ? a.date.slice(5) === t.date.slice(5) : a.date === t.date;
      if (!hit) continue;
      for (const to of await coupleTokens(a.couple_id)) {
        messages.push({
          to,
          title: `${a.label} ${t.dday} ⭐`,
          body: t.dday === 'D-1' ? '내일이에요! 계획은 세우셨나요?' : '일주일 남았어요',
          data: { url: '/(tabs)/playlist/singles' },
        });
      }
    }
  }

  await sendPushes(messages);
  return json({ date: today, released: released?.length ?? 0, pushed: messages.length });
});

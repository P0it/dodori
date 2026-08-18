/**
 * 알림 발송 워커 — Vercel Function.
 *
 * 설계: docs/superpowers/specs/2026-08-18-web-push-notifications-design.md
 *
 * 알림 행은 Postgres 트리거가 이미 만들어 뒀다. 이 함수는 `pushed_at is null`인 행을
 * 집어 푸시를 쏘고 도장을 찍을 뿐이라 **여러 번 불려도 안전하다.**
 * 평소엔 DB의 kicker(net.http_post)가 깨우지만, 그게 죽어도 이 엔드포인트를 주기적으로
 * 부르기만 하면 그대로 동작한다 — Supabase 종속을 여기 가두려는 설계다.
 *
 * service_role 키로 붙으므로 **RLS가 적용되지 않는다.** 스코프는 이 파일이 직접 챙긴다.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import {
  notificationHref,
  notificationText,
  type NotificationKind,
  type NotificationTargetKind,
} from '../../src/lib/notifications';

/** 한 번에 처리할 행 수 — kicker가 이벤트마다 깨우므로 밀릴 일이 거의 없다 */
const BATCH = 50;

interface Row {
  id: string;
  recipient_id: string;
  actor_id: string;
  kind: NotificationKind;
  target_kind: NotificationTargetKind;
  target_id: string;
  preview: string | null;
}

interface Subscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const secret = process.env.NOTIFY_WORKER_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  // URL·공개키는 앱 빌드가 이미 쓰는 변수를 그대로 재사용한다 — 같은 값을 두 이름으로
  // 관리하면 한쪽만 바뀌었을 때 조용히 어긋난다 (둘 다 공개값이라 감출 이유도 없다).
  const url = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vapidPublic = process.env.VAPID_PUBLIC_KEY ?? process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!url || !serviceKey || !vapidPublic || !vapidPrivate) {
    return res.status(500).json({ error: 'missing env' });
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:taesion9060@gmail.com',
    vapidPublic,
    vapidPrivate,
  );

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: rows, error } = await admin
    .from('notifications')
    .select('id, recipient_id, actor_id, kind, target_kind, target_id, preview')
    .is('pushed_at', null)
    .order('created_at', { ascending: true })
    .limit(BATCH);
  if (error) return res.status(500).json({ error: error.message });
  if (!rows?.length) return res.status(200).json({ sent: 0 });

  // 같은 사람에게 여러 건이 밀려 있어도 이름은 한 번만 읽는다
  const actorNames = new Map<string, string | null>();
  const actorIds = [...new Set(rows.map((r) => r.actor_id))];
  const { data: actors } = await admin
    .from('profiles')
    .select('id, nickname')
    .in('id', actorIds);
  for (const a of actors ?? []) actorNames.set(a.id, a.nickname);

  let sent = 0;
  for (const row of rows as Row[]) {
    const n = {
      kind: row.kind,
      targetKind: row.target_kind,
      targetId: row.target_id,
      preview: row.preview,
    };
    const { title, body } = notificationText(n, actorNames.get(row.actor_id));

    // 배지 숫자는 서버가 센다 — 서비스워커는 DB를 읽을 수 없다.
    // 이 행도 아직 안 읽은 상태이므로 자기 자신이 카운트에 포함된다.
    const { count } = await admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', row.recipient_id)
      .is('read_at', null);

    const payload = JSON.stringify({
      title,
      body,
      url: notificationHref(n),
      badge: count ?? 1,
      tag: row.id,
    });

    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', row.recipient_id);

    for (const sub of (subs ?? []) as Subscription[]) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
        sent++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          // 죽은 구독 — 다음 접속 때 재구독된다
          await admin.from('push_subscriptions').delete().eq('id', sub.id);
        } else {
          await admin
            .from('push_subscriptions')
            .update({ failed_at: new Date().toISOString() })
            .eq('id', sub.id);
        }
      }
    }

    // 네이티브(Expo Push)는 기존 경로 그대로. 웹 구독이 없어도 여기로 갈 수 있다.
    const { data: profile } = await admin
      .from('profiles')
      .select('push_token')
      .eq('id', row.recipient_id)
      .maybeSingle();
    if (profile?.push_token) {
      try {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([
            {
              to: profile.push_token,
              title,
              body,
              badge: count ?? 1,
              data: { url: notificationHref(n) },
            },
          ]),
        });
        sent++;
      } catch {
        // Expo 발송 실패는 웹 발송을 막지 않는다
      }
    }

    // 구독이 하나도 없었더라도 도장을 찍는다 — 안 그러면 큐에 영원히 남는다.
    // 알림 행 자체는 살아서 배지·목록에 그대로 반영된다.
    await admin
      .from('notifications')
      .update({ pushed_at: new Date().toISOString() })
      .eq('id', row.id);
  }

  return res.status(200).json({ processed: rows.length, sent });
}

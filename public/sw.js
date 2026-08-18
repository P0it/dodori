/**
 * 서비스워커 — 웹 푸시 수신 + 앱 아이콘 배지.
 *
 * 설계: docs/superpowers/specs/2026-08-18-web-push-notifications-design.md
 * 여기서는 DB를 읽을 수 없으므로 배지 숫자는 서버가 payload.badge에 실어 보낸다.
 * 이 파일은 번들러를 거치지 않고 public/에서 그대로 /sw.js로 서빙된다 (vercel.json rewrite 예외).
 */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // payload가 JSON이 아니면 알림만 띄우고 넘어간다
  }

  const title = data.title || '도돌이';
  const options = {
    body: data.body || '',
    // 같은 알림이 두 번 오면 덮어쓴다 (알림 id를 tag로 쓴다)
    tag: data.tag,
    icon: '/icons/icon-512.png',
    badge: '/icons/icon-512.png',
    data: { url: data.url || '/' },
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      typeof data.badge === 'number' && navigator.setAppBadge
        ? navigator.setAppBadge(data.badge)
        : Promise.resolve(),
    ]),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      // 이미 열린 창이 있으면 그 창을 살리고 경로만 알려준다 (새 창을 띄우면 상태가 날아간다)
      for (const client of list) {
        if ('focus' in client) {
          client.postMessage({ type: 'notification-click', url });
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 서명 URL 캐시 — 유효기간이 남은 서명은 다시 발급받지 않는다.
 *
 * 화면을 다시 열 때마다(staleTime 60초) 사진 전부를 재서명하면 진입 때마다 왕복이 한 번씩
 * 더 붙는다 — 사진이 한 박자 늦게 뜨는 원인.
 *
 * 웹에서는 이게 더 중요하다. expo-image의 cacheKey는 네이티브 전용이라(웹은 `<img src>` +
 * 브라우저 HTTP 캐시라 키가 URL 전체다) 재서명으로 토큰이 바뀌면 같은 사진을 통째로 다시 받는다.
 * 그래서 저장소에도 남긴다 — 새로고침해도 같은 URL이 나와야 브라우저 캐시가 맞는다.
 *
 * photos.ts가 아니라 별도 모듈인 이유: 로그아웃(auth.ts)에서도 비워야 하는데
 * photos.ts를 부르면 auth → photos → couple → auth 순환 import가 된다.
 */
export const SIGN_TTL_SEC = 24 * 60 * 60;
/** 만료 직전 URL을 쥐여주면 화면에 떠 있는 동안 깨진다 — 30분 남으면 새로 받는다 */
const REUSE_MARGIN_MS = 30 * 60_000;
const STORE_KEY = 'photo-signs-v1';

const cache = new Map<string, { url: string; expiresAt: number }>();

/** 저장소에서 한 번만 읽는다 — 서명이 필요한 첫 호출이 이걸 기다린다 */
let load: Promise<void> | null = null;

export function readySigns(): Promise<void> {
  if (!load) {
    load = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORE_KEY);
        if (!raw) return;
        const now = Date.now();
        for (const [key, url, expiresAt] of JSON.parse(raw) as [string, string, number][]) {
          if (expiresAt > now) cache.set(key, { url, expiresAt });
        }
      } catch {
        // 캐시일 뿐이다 — 못 읽으면 그냥 새로 서명한다
      }
    })();
  }
  return load;
}

/** 쓰기는 몰아서 한 번 — 한 화면이 사진 수십 장을 서명해도 저장은 1회다 */
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSave(): void {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    const now = Date.now();
    const rows = [...cache.entries()]
      .filter(([, v]) => v.expiresAt > now)
      .map(([k, v]) => [k, v.url, v.expiresAt]);
    AsyncStorage.setItem(STORE_KEY, JSON.stringify(rows)).catch(() => {});
  }, 1000);
}

export function cachedSign(key: string): string | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  return hit.expiresAt - Date.now() > REUSE_MARGIN_MS ? hit.url : undefined;
}

export function putSign(key: string, url: string): string {
  cache.set(key, { url, expiresAt: Date.now() + SIGN_TTL_SEC * 1000 });
  scheduleSave();
  return url;
}

/** 로그아웃 — 서명 URL은 그 자체로 사진을 여는 주소다. 기기에 남기지 않는다 */
export async function clearSignCache(): Promise<void> {
  cache.clear();
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  await AsyncStorage.removeItem(STORE_KEY).catch(() => {});
}

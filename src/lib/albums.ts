/**
 * 앨범(데이트) 캐러셀 — 시간축 정렬·포커스 판정. 순수 함수.
 * 캐러셀은 왼쪽이 과거, 오른쪽이 미래이고 초기 포커스는 "오늘에 가장 가까운" 앨범이다.
 */
import { diffDays, type ISODate } from './date';

/**
 * 오늘에 가장 가까운 앨범의 인덱스. dates는 오름차순(과거→미래) 전제.
 * 과거·미래 거리가 같으면 미래를 고른다 — 다가오는 계획이 지난 기록보다 급하다.
 */
export function nearestIndex(dates: ISODate[], today: ISODate): number {
  if (dates.length === 0) return 0;
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < dates.length; i++) {
    const delta = diffDays(today, dates[i]); // 미래면 양수, 과거면 음수
    // 동률(|과거| === |미래|)일 때 미래가 이기도록, 과거에만 아주 작은 페널티를 준다
    const dist = delta >= 0 ? delta : -delta + 0.5;
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

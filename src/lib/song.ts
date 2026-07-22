/**
 * 오늘의 추천곡 — 전역 곡 풀에서 하루 하나를 고른다.
 * 배정 테이블도 cron도 없다: KST 날짜가 곧 인덱스다. 같은 날 = 두 사람 같은 곡.
 */
import { toEpochDay, type ISODate } from './date';

export interface Song {
  id: string;
  seq: number;
  title: string;
  artist: string;
  artworkUrl: string;
  /** 30초 미리듣기 (m4a) */
  previewUrl: string;
  appleUrl: string;
}

/** seq 순으로 하루 하나씩 소진 — 풀을 다 쓰면 처음으로 돌아온다 */
export function pickTodaySong(pool: Song[], today: ISODate): Song | null {
  if (pool.length === 0) return null;
  const ordered = [...pool].sort((a, b) => a.seq - b.seq);
  const i = ((toEpochDay(today) % ordered.length) + ordered.length) % ordered.length;
  return ordered[i];
}

/** 전곡 듣기 — 한국에서 보편적인 유튜브 뮤직으로 넘긴다 (애플뮤직은 구독자만) */
export function youtubeMusicSearchUrl(artist: string, title: string): string {
  return `https://music.youtube.com/search?q=${encodeURIComponent(`${artist} ${title}`)}`;
}

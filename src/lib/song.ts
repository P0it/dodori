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

export interface MusicService {
  id: 'youtube' | 'spotify' | 'apple' | 'melon';
  label: string;
  url: (song: Song) => string;
}

const query = (song: Song) => encodeURIComponent(`${song.artist} ${song.title}`);

/**
 * 전곡 듣기 대상 — 쓰는 음원 앱이 사람마다 달라 매번 고르게 한다.
 * 전부 평범한 https: 네 서비스 모두 자기 도메인을 앱이 소유하므로
 * OS가 앱→(미설치 시)웹으로 알아서 보낸다 — 커스텀 스킴도 설치 감지도 불필요.
 */
export const MUSIC_SERVICES: MusicService[] = [
  {
    id: 'youtube',
    label: '유튜브 뮤직',
    url: (s) => `https://music.youtube.com/search?q=${query(s)}`,
  },
  {
    id: 'spotify',
    label: '스포티파이',
    url: (s) => `https://open.spotify.com/search/${query(s)}`,
  },
  {
    id: 'apple',
    label: '애플 뮤직',
    // 유일하게 검색이 아닌 곡 직링크 — iTunes trackViewUrl을 이미 들고 있다
    url: (s) => s.appleUrl || `https://music.apple.com/kr/search?term=${query(s)}`,
  },
  {
    id: 'melon',
    label: '멜론',
    url: (s) => `https://www.melon.com/search/total/index.htm?q=${query(s)}`,
  },
];

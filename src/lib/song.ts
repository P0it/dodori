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

/**
 * 같은 가수가 며칠씩 연달아 나오지 않도록 풀을 한 번 재배열한다.
 * 시드가 가수별로 묶여 들어와 seq 순 그대로 소진하면 3~5일 내리 같은 가수였다.
 * 남은 곡이 가장 많은 가수에서 하나씩 꺼내되 직전 가수는 건너뛴다 — 순수·결정적이라
 * 두 사람이 여전히 같은 날 같은 곡을 본다.
 */
export function spreadByArtist(pool: Song[]): Song[] {
  const groups = new Map<string, Song[]>();
  for (const s of [...pool].sort((a, b) => a.seq - b.seq)) {
    const g = groups.get(s.artist);
    if (g) g.push(s);
    else groups.set(s.artist, [s]);
  }

  const out: Song[] = [];
  let prev: string | null = null;
  while (out.length < pool.length) {
    // 남은 곡이 가장 많은 가수 (동수면 seq가 앞선 쪽 — Map은 삽입 순서를 지킨다)
    let pick: string | null = null;
    for (const [artist, songs] of groups) {
      if (songs.length === 0 || artist === prev) continue;
      if (pick === null || songs.length > groups.get(pick)!.length) pick = artist;
    }
    if (pick === null) pick = prev!; // 남은 게 직전 가수뿐 — 어쩔 수 없이 연달아
    out.push(groups.get(pick)!.shift()!);
    prev = pick;
  }

  // 마지막 날 다음은 다시 첫날 — 양 끝이 같은 가수면 마지막 곡을 안전한 자리로 옮긴다
  if (out.length > 2 && out[0].artist === out[out.length - 1].artist) {
    const tail = out.pop()!;
    const i = out.findIndex(
      (s, idx) => idx > 0 && s.artist !== tail.artist && out[idx - 1].artist !== tail.artist,
    );
    out.splice(i < 0 ? out.length : i, 0, tail);
  }
  return out;
}

/** 하루 하나씩 소진 — 풀을 다 쓰면 처음으로 돌아온다 */
export function pickTodaySong(pool: Song[], today: ISODate): Song | null {
  if (pool.length === 0) return null;
  const ordered = spreadByArtist(pool);
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

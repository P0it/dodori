import { pickTodaySong, youtubeMusicSearchUrl, type Song } from '../song';

const song = (seq: number): Song => ({
  id: `id-${seq}`,
  seq,
  title: `t${seq}`,
  artist: `a${seq}`,
  artworkUrl: '',
  previewUrl: '',
  appleUrl: '',
});

describe('pickTodaySong', () => {
  const pool = [song(0), song(1), song(2)];

  it('빈 풀이면 null', () => {
    expect(pickTodaySong([], '2026-07-16')).toBeNull();
  });

  it('같은 날은 항상 같은 곡 (두 사람이 같은 곡을 본다)', () => {
    expect(pickTodaySong(pool, '2026-07-16')).toBe(pickTodaySong(pool, '2026-07-16'));
  });

  it('하루 지나면 다음 seq', () => {
    const a = pickTodaySong(pool, '2026-07-16')!;
    const b = pickTodaySong(pool, '2026-07-17')!;
    expect(b.seq).toBe((a.seq + 1) % pool.length);
  });

  it('풀을 다 쓰면 처음으로 순환', () => {
    const a = pickTodaySong(pool, '2026-07-16')!;
    const wrapped = pickTodaySong(pool, '2026-07-19')!; // 3일 뒤 = 풀 크기만큼
    expect(wrapped.seq).toBe(a.seq);
  });

  it('풀 순서가 섞여 들어와도 seq 기준으로 고른다', () => {
    const shuffled = [song(2), song(0), song(1)];
    expect(pickTodaySong(shuffled, '2026-07-16')!.seq).toBe(pickTodaySong(pool, '2026-07-16')!.seq);
  });
});

describe('youtubeMusicSearchUrl', () => {
  it('아티스트와 제목을 한 검색어로 인코딩', () => {
    expect(youtubeMusicSearchUrl('NewJeans', 'Hype Boy')).toBe(
      'https://music.youtube.com/search?q=NewJeans%20Hype%20Boy',
    );
  });

  it('한글·특수문자도 인코딩', () => {
    expect(youtubeMusicSearchUrl('아이유', 'Love wins all')).toContain('%EC%95%84%EC%9D%B4%EC%9C%A0');
  });
});

import { MUSIC_SERVICES, pickTodaySong, type MusicService, type Song } from '../song';

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

describe('MUSIC_SERVICES', () => {
  const urlOf = (id: MusicService['id'], s: Song) => MUSIC_SERVICES.find((m) => m.id === id)!.url(s);
  const hypeBoy: Song = { ...song(0), artist: 'NewJeans', title: 'Hype Boy' };

  it('아티스트와 제목을 한 검색어로 인코딩', () => {
    expect(urlOf('youtube', hypeBoy)).toBe('https://music.youtube.com/search?q=NewJeans%20Hype%20Boy');
    expect(urlOf('spotify', hypeBoy)).toBe('https://open.spotify.com/search/NewJeans%20Hype%20Boy');
    expect(urlOf('melon', hypeBoy)).toBe(
      'https://www.melon.com/search/total/index.htm?q=NewJeans%20Hype%20Boy',
    );
  });

  it('한글·특수문자도 인코딩', () => {
    const iu: Song = { ...song(0), artist: '아이유', title: 'Love wins all' };
    for (const service of MUSIC_SERVICES) {
      expect(service.url(iu)).toContain('%EC%95%84%EC%9D%B4%EC%9C%A0');
    }
  });

  it('애플 뮤직은 검색이 아니라 곡 직링크', () => {
    const withApple: Song = { ...hypeBoy, appleUrl: 'https://music.apple.com/kr/album/x/1?i=2' };
    expect(urlOf('apple', withApple)).toBe('https://music.apple.com/kr/album/x/1?i=2');
  });

  it('곡 직링크가 없으면 애플 뮤직도 검색으로 폴백', () => {
    expect(urlOf('apple', hypeBoy)).toBe('https://music.apple.com/kr/search?term=NewJeans%20Hype%20Boy');
  });
});

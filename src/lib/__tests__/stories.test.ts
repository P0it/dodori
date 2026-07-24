import {
  formatMonthLabel,
  groupByMonth,
  isLive,
  liveStories,
  ringState,
  STORY_TTL_MS,
  type StoryLike,
} from '../stories';

const NOW = new Date('2026-07-24T12:00:00+09:00');

const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();
const HOUR = 60 * 60 * 1000;

const story = (over: Partial<StoryLike> = {}): StoryLike => ({
  authorId: 'me',
  createdAt: ago(HOUR),
  seenAt: null,
  ...over,
});

describe('isLive', () => {
  it('24시간 이내면 살아있다', () => {
    expect(isLive(ago(23 * HOUR), NOW)).toBe(true);
  });

  it('24시간을 넘기면 링에서 내려간다', () => {
    expect(isLive(ago(STORY_TTL_MS + 1000), NOW)).toBe(false);
  });

  it('정확히 24시간이면 이미 내려간 것으로 본다', () => {
    expect(isLive(ago(STORY_TTL_MS), NOW)).toBe(false);
  });
});

describe('liveStories', () => {
  it('살아있는 것만 남기고 올린 순으로 정렬', () => {
    const older = story({ createdAt: ago(5 * HOUR) });
    const newer = story({ createdAt: ago(1 * HOUR) });
    const expired = story({ createdAt: ago(30 * HOUR) });
    expect(liveStories([newer, expired, older], NOW)).toEqual([older, newer]);
  });
});

describe('ringState', () => {
  it('24시간 내 스토리가 없으면 none', () => {
    expect(ringState([story({ authorId: 'you', createdAt: ago(30 * HOUR) })], 'you', NOW)).toBe('none');
  });

  it('다른 사람 스토리는 세지 않는다', () => {
    expect(ringState([story({ authorId: 'me' })], 'you', NOW)).toBe('none');
  });

  it('안 본 스토리가 하나라도 있으면 new', () => {
    const stories = [
      story({ authorId: 'you', seenAt: ago(30 * 60 * 1000) }),
      story({ authorId: 'you', seenAt: null }),
    ];
    expect(ringState(stories, 'you', NOW)).toBe('new');
  });

  it('전부 봤으면 seen', () => {
    expect(ringState([story({ authorId: 'you', seenAt: ago(10 * 60 * 1000) })], 'you', NOW)).toBe('seen');
  });

  it('만료된 스토리가 안 봤어도 new로 만들지 않는다', () => {
    const stories = [
      story({ authorId: 'you', createdAt: ago(40 * HOUR), seenAt: null }),
      story({ authorId: 'you', createdAt: ago(2 * HOUR), seenAt: ago(HOUR) }),
    ];
    expect(ringState(stories, 'you', NOW)).toBe('seen');
  });
});

describe('groupByMonth', () => {
  it('최신 월부터, 월 안에서도 최신부터', () => {
    const a = { createdAt: '2026-07-24T03:00:00Z' };
    const b = { createdAt: '2026-07-02T03:00:00Z' };
    const c = { createdAt: '2026-06-30T03:00:00Z' };
    expect(groupByMonth([b, c, a])).toEqual([
      { key: '2026-07', stories: [a, b] },
      { key: '2026-06', stories: [c] },
    ]);
  });

  it('월 경계는 KST 기준 — UTC로 전월인 시각도 KST에선 다음 달', () => {
    // 2026-06-30T16:00Z = KST 2026-07-01 01:00
    expect(groupByMonth([{ createdAt: '2026-06-30T16:00:00Z' }])[0].key).toBe('2026-07');
  });
});

describe('formatMonthLabel', () => {
  it('한글 월 표기', () => {
    expect(formatMonthLabel('2026-07')).toBe('2026년 7월');
  });
});

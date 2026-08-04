import {
  clampOverlay,
  clampPan,
  containedRect,
  coverScale,
  cropRect,
  createTextOverlay,
  formatMonthLabel,
  groupByMonth,
  isLive,
  liveStories,
  OVERLAY_MAX,
  OVERLAY_SIZE_MAX,
  OVERLAY_SIZE_MIN,
  parseOverlays,
  ringState,
  STORY_TTL_MS,
  type StoryLike,
  type TextOverlay,
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

describe('clampOverlay', () => {
  const base = createTextOverlay('a', '안녕', 'white');

  it('사진 밖으로 나간 좌표를 되돌린다', () => {
    expect(clampOverlay({ ...base, x: 1.4, y: -0.2 })).toMatchObject({ x: 1, y: 0 });
  });

  it('크기를 읽을 수 있는 범위로 가둔다', () => {
    expect(clampOverlay({ ...base, size: 9 }).size).toBe(OVERLAY_SIZE_MAX);
    expect(clampOverlay({ ...base, size: 0 }).size).toBe(OVERLAY_SIZE_MIN);
  });

  it('회전은 0~360으로 정규화 (음수도)', () => {
    expect(clampOverlay({ ...base, rotation: -90 }).rotation).toBe(270);
    expect(clampOverlay({ ...base, rotation: 450 }).rotation).toBe(90);
  });
});

describe('parseOverlays', () => {
  const valid: TextOverlay = createTextOverlay('a', '오늘', 'pink');

  it('배열이 아니면 빈 배열', () => {
    expect(parseOverlays(null)).toEqual([]);
    expect(parseOverlays({ text: '아님' })).toEqual([]);
  });

  it('모양이 맞는 항목만 남긴다', () => {
    const rows = [valid, { id: 'b' }, { ...valid, id: 'c', x: 'NaN' }, null, { ...valid, id: 'd', text: '' }];
    expect(parseOverlays(rows).map((o) => o.id)).toEqual(['a']);
  });

  it('모르는 색 키는 기본색으로 되돌린다', () => {
    expect(parseOverlays([{ ...valid, color: 'chartreuse' }])[0].color).toBe('white');
  });

  it('저장된 값이 범위를 벗어나도 읽을 때 다듬는다', () => {
    expect(parseOverlays([{ ...valid, size: 99 }])[0].size).toBe(OVERLAY_SIZE_MAX);
  });

  it('개수 상한을 넘기지 않는다', () => {
    const many = Array.from({ length: OVERLAY_MAX + 5 }, (_, i) => ({ ...valid, id: `x${i}` }));
    expect(parseOverlays(many)).toHaveLength(OVERLAY_MAX);
  });
});

describe('containedRect', () => {
  it('세로 사진은 위아래를 꽉 채우고 좌우가 남는다', () => {
    // 1000x2000 사진을 300x400 프레임에 → 배율 0.2 → 200x400, x 여백 50
    expect(containedRect(1000, 2000, 300, 400)).toEqual({ x: 50, y: 0, width: 200, height: 400 });
  });

  it('가로 사진은 좌우를 꽉 채우고 위아래가 남는다', () => {
    expect(containedRect(2000, 1000, 400, 400)).toEqual({ x: 0, y: 100, width: 400, height: 200 });
  });

  it('사진 크기를 모르면 프레임 전체로 본다', () => {
    expect(containedRect(null, null, 300, 400)).toEqual({ x: 0, y: 0, width: 300, height: 400 });
  });
});

// 세로 9:16 캔버스 360x640, 가로 사진 2000x1000 → cover 배율은 높이 기준 0.64
describe('coverScale', () => {
  it('가로 사진은 높이를 기준으로 덮는다', () => {
    expect(coverScale(2000, 1000, 360, 640)).toBeCloseTo(0.64);
  });

  it('세로 사진은 너비를 기준으로 덮는다', () => {
    expect(coverScale(1000, 3000, 360, 640)).toBeCloseTo(0.36);
  });

  it('사진 크기를 모르면 1', () => {
    expect(coverScale(0, 0, 360, 640)).toBe(1);
  });
});

describe('clampPan', () => {
  it('덮고 남는 축으로만 밀 수 있다', () => {
    // 2000x1000 * 0.64 = 1280x640 → 가로 여유 (1280-360)/2 = 460, 세로 여유 0
    expect(clampPan(2000, 1000, 360, 640, 1, 1000, 50)).toEqual({ tx: 460, ty: 0 });
  });

  it('여유 안에서는 그대로 둔다', () => {
    expect(clampPan(2000, 1000, 360, 640, 1, -200, 0)).toEqual({ tx: -200, ty: 0 });
  });

  it('확대하면 밀 수 있는 폭이 늘어난다', () => {
    const { ty } = clampPan(2000, 1000, 360, 640, 2, 0, 5000);
    expect(ty).toBeCloseTo(320); // (1000*1.28 - 640)/2
  });
});

describe('cropRect', () => {
  it('안 밀었으면 사진 한가운데를 캔버스 비율로 잘라낸다', () => {
    // 캔버스 360x640을 배율 0.64로 되돌리면 원본에서 562.5x1000 → 세로가 꽉 찬다
    expect(cropRect(2000, 1000, 360, 640, 1, 0, 0)).toEqual({
      x: 719,
      y: 0,
      width: 563,
      height: 1000,
    });
  });

  it('오른쪽으로 밀면 잘라내는 자리가 왼쪽으로 옮겨간다', () => {
    const centered = cropRect(2000, 1000, 360, 640, 1, 0, 0);
    const pushed = cropRect(2000, 1000, 360, 640, 1, 320, 0);
    expect(pushed.x).toBeLessThan(centered.x);
    expect(pushed.width).toBe(centered.width);
  });

  it('밀어도 원본 밖으로는 나가지 않는다', () => {
    const r = cropRect(2000, 1000, 360, 640, 1, 99999, 99999);
    expect(r.x).toBe(0);
    expect(r.y).toBe(0);
    expect(r.x + r.width).toBeLessThanOrEqual(2000);
    expect(r.y + r.height).toBeLessThanOrEqual(1000);
  });

  it('확대하면 잘라내는 영역이 좁아진다', () => {
    const wide = cropRect(2000, 1000, 360, 640, 1, 0, 0);
    const zoomed = cropRect(2000, 1000, 360, 640, 2, 0, 0);
    expect(zoomed.width).toBeLessThan(wide.width);
    expect(zoomed.height).toBeLessThan(wide.height);
  });
});

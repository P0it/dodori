import {
  estimateVideoBytes,
  formatBytes,
  isVideoPath,
  renditionPath,
  storagePathsFor,
  uploadEstimate,
  uploadRatio,
  VIDEO_MAX_MS,
} from '../media';

const 사진 = 'couple/parent/abc.jpg';
const 영상 = 'couple/parent/abc.mp4';

describe('isVideoPath', () => {
  it('본체 확장자 하나로 사진과 영상을 가른다', () => {
    expect(isVideoPath(영상)).toBe(true);
    expect(isVideoPath(사진)).toBe(false);
  });

  it('포스터는 영상의 렌디션이지만 그 자체는 사진이다', () => {
    expect(isVideoPath('couple/parent/abc_poster.jpg')).toBe(false);
    expect(isVideoPath('couple/parent/abc_360.jpg')).toBe(false);
  });
});

describe('renditionPath', () => {
  it('사진 — 본체가 곧 feed, grid만 _360', () => {
    expect(renditionPath(사진, 'feed')).toBe(사진);
    expect(renditionPath(사진, 'grid')).toBe('couple/parent/abc_360.jpg');
  });

  it('영상 — 그림은 둘 다 포스터 JPEG다 (mp4를 그대로 돌려주면 안 된다)', () => {
    expect(renditionPath(영상, 'feed')).toBe('couple/parent/abc_poster.jpg');
    expect(renditionPath(영상, 'grid')).toBe('couple/parent/abc_360.jpg');
  });

  it('확장자가 없는 옛 경로는 건드리지 않는다', () => {
    expect(renditionPath('couple/parent/abc', 'grid')).toBe('couple/parent/abc');
  });

  it('경로 중간의 확장자를 잘못 집지 않는다 — 끝만 본다', () => {
    expect(renditionPath('couple/a.mp4/b.jpg', 'grid')).toBe('couple/a.mp4/b_360.jpg');
  });
});

describe('storagePathsFor', () => {
  it('렌디션이 있는 사진은 본체 + _360 두 개', () => {
    expect(storagePathsFor({ storagePath: 사진, renditions: true })).toEqual([
      사진,
      'couple/parent/abc_360.jpg',
    ]);
  });

  it('렌디션 도입 전 옛 사진은 본체 하나뿐이다', () => {
    expect(storagePathsFor({ storagePath: 사진, renditions: false })).toEqual([사진]);
  });

  it('영상은 본체 + 포스터 + 360 세 개 — 하나라도 빠지면 고아 파일이 남는다', () => {
    expect(storagePathsFor({ storagePath: 영상, renditions: true })).toEqual([
      영상,
      'couple/parent/abc_poster.jpg',
      'couple/parent/abc_360.jpg',
    ]);
  });
});

describe('formatBytes', () => {
  it('1MB 미만은 KB', () => {
    expect(formatBytes(1023)).toBe('1KB');
    expect(formatBytes(185 * 1024)).toBe('185KB');
    expect(formatBytes(1024 * 1023)).toBe('1023KB');
  });

  it('1MB부터는 MB — 10MB 미만만 소수 한 자리', () => {
    expect(formatBytes(1024 * 1024)).toBe('1MB');
    expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5MB');
    expect(formatBytes(62 * 1024 * 1024)).toBe('62MB');
    expect(formatBytes(200 * 1024 * 1024)).toBe('200MB');
  });

  it('0과 비정상 값은 0KB', () => {
    expect(formatBytes(0)).toBe('0KB');
    expect(formatBytes(-1)).toBe('0KB');
    expect(formatBytes(NaN)).toBe('0KB');
  });
});

describe('estimateVideoBytes', () => {
  it('15초 720p는 대략 5MB 안쪽이다 — 쿼터 문구가 이 값에 기댄다', () => {
    const bytes = estimateVideoBytes(VIDEO_MAX_MS);
    expect(bytes).toBeGreaterThan(4 * 1024 * 1024);
    expect(bytes).toBeLessThan(5 * 1024 * 1024);
  });

  it('길이를 모르면 0', () => {
    expect(estimateVideoBytes(0)).toBe(0);
    expect(estimateVideoBytes(NaN)).toBe(0);
  });
});

describe('uploadEstimate', () => {
  const 영상항목 = { video: { durationMs: VIDEO_MAX_MS } };
  const 사진항목 = {};

  it('사진은 세지 않는다 — 사람이 놀라는 쪽은 영상이다', () => {
    const e = uploadEstimate([사진항목, 사진항목], 100 * 1024 * 1024);
    expect(e.videoCount).toBe(0);
    expect(e.bytes).toBe(0);
  });

  it('실제 파일 크기를 알면 어림값 대신 그걸 쓴다', () => {
    const e = uploadEstimate([{ ...영상항목, bytes: 3 * 1024 * 1024 }], 100 * 1024 * 1024);
    expect(e.bytes).toBe(3 * 1024 * 1024);
    expect(e.percentOfRemaining).toBe(3);
  });

  it('영상 2개가 남은 공간에서 차지하는 비율', () => {
    const e = uploadEstimate(
      [영상항목, 영상항목, 사진항목],
      100 * 1024 * 1024,
    );
    expect(e.videoCount).toBe(2);
    expect(e.percentOfRemaining).toBeGreaterThan(0);
    expect(e.percentOfRemaining).toBeLessThanOrEqual(100);
  });

  it('남은 공간이 0이어도 나눗셈이 깨지지 않는다', () => {
    expect(uploadEstimate([영상항목], 0).percentOfRemaining).toBe(100);
    expect(uploadEstimate([영상항목], -5).percentOfRemaining).toBe(100);
  });

  it('남은 공간을 넘어서도 100%에서 멈춘다', () => {
    expect(uploadEstimate([영상항목], 1024).percentOfRemaining).toBe(100);
  });
});

describe('uploadRatio', () => {
  it('아직 시작 전이면 0', () => {
    expect(uploadRatio(null)).toBe(0);
    expect(uploadRatio(undefined)).toBe(0);
  });

  it('항목 수로 나눈 자리에 항목 안 비율을 얹는다', () => {
    expect(uploadRatio({ index: 0, total: 2, ratio: 0 })).toBe(0);
    expect(uploadRatio({ index: 0, total: 2, ratio: 1 })).toBe(0.5);
    expect(uploadRatio({ index: 1, total: 2, ratio: 0.5 })).toBe(0.75);
  });

  it('total이 0이어도 나눗셈이 터지지 않는다', () => {
    expect(uploadRatio({ index: 0, total: 0, ratio: 0.5 })).toBe(0);
  });

  it('범위를 벗어난 값은 0~1로 눌린다', () => {
    expect(uploadRatio({ index: 0, total: 1, ratio: 1.4 })).toBe(1);
    expect(uploadRatio({ index: 0, total: 1, ratio: -0.3 })).toBe(0);
  });
});

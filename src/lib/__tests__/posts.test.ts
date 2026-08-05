import { isFramed, postFrameRatio, postFrameRatioOf } from '../posts';

describe('postFrameRatio', () => {
  it('범위 안의 비율은 그대로 쓴다', () => {
    expect(postFrameRatio(1000, 1000)).toBeCloseTo(1);
    expect(postFrameRatio(1000, 1200)).toBeCloseTo(1.2);
    expect(postFrameRatio(1200, 1000)).toBeCloseTo(0.8333, 3);
  });

  it('세로로 너무 긴 사진은 4:5(1.25)에서 멈춘다', () => {
    // 3:4 폰 사진 → 1.333…
    expect(postFrameRatio(3000, 4000)).toBeCloseTo(1.25);
    // 9:16 세로 사진 → 1.777…
    expect(postFrameRatio(1080, 1920)).toBeCloseTo(1.25);
    // 경계값은 그대로
    expect(postFrameRatio(1080, 1350)).toBeCloseTo(1.25);
  });

  it('가로로 너무 넓은 사진은 16:9(0.5625)에서 멈춘다', () => {
    expect(postFrameRatio(4000, 1000)).toBeCloseTo(0.5625);
    // 경계값은 그대로
    expect(postFrameRatio(1920, 1080)).toBeCloseTo(0.5625);
  });

  it('크기를 모르면 정사각으로 본다', () => {
    expect(postFrameRatio(null, null)).toBe(1);
    expect(postFrameRatio(undefined, undefined)).toBe(1);
    expect(postFrameRatio(0, 0)).toBe(1);
    expect(postFrameRatio(1000, null)).toBe(1);
  });
});

describe('postFrameRatioOf', () => {
  it('첫 사진이 프레임을 정한다 — 뒤에 오는 사진의 비율은 보지 않는다', () => {
    const 가로첫장 = [
      { width: 1920, height: 1080 },
      { width: 1080, height: 1350 },
    ];
    expect(postFrameRatioOf(가로첫장)).toBeCloseTo(0.5625);

    const 세로첫장 = [
      { width: 1080, height: 1350 },
      { width: 1920, height: 1080 },
    ];
    expect(postFrameRatioOf(세로첫장)).toBeCloseTo(1.25);
  });

  it('사진이 없으면 정사각', () => {
    expect(postFrameRatioOf([])).toBe(1);
  });
});

describe('isFramed', () => {
  it('프레임 비율과 같으면 다시 자르지 않는다', () => {
    expect(isFramed({ width: 1080, height: 608 }, 0.5625)).toBe(true);
    // 크롭이 픽셀로 반올림돼 딱 떨어지지 않아도 같은 프레임으로 본다
    expect(isFramed({ width: 1080, height: 607 }, 0.5625)).toBe(true);
  });

  it('프레임 비율과 다르면 잘라야 한다 — 이게 피드에서 두 번 잘리던 사진들이다', () => {
    // 4:5 세로 사진이 16:9 프레임에 들어가는 경우
    expect(isFramed({ width: 1080, height: 1350 }, 0.5625)).toBe(false);
    expect(isFramed({ width: 1000, height: 1000 }, 1.25)).toBe(false);
  });

  it('크기를 모르면 잘라야 하는 것으로 본다', () => {
    expect(isFramed({ width: null, height: null }, 1)).toBe(false);
    expect(isFramed({ width: 1000, height: undefined }, 1)).toBe(false);
  });
});

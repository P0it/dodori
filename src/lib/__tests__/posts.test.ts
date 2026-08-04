import { postFrameRatio } from '../posts';

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

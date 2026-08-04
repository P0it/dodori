import {
  addHours,
  fromMinutes,
  isAfter,
  isHHmm,
  minuteOptions,
  snapMinute,
  toMinutes,
} from '../time';

describe('isHHmm', () => {
  it('24시간제만 받는다', () => {
    expect(isHHmm('00:00')).toBe(true);
    expect(isHHmm('23:59')).toBe(true);
    expect(isHHmm('24:00')).toBe(false);
    expect(isHHmm('19:60')).toBe(false);
    expect(isHHmm('9:00')).toBe(false);
    expect(isHHmm('')).toBe(false);
  });
});

describe('toMinutes / fromMinutes', () => {
  it('왕복', () => {
    expect(toMinutes('19:05')).toBe(19 * 60 + 5);
    expect(fromMinutes(19 * 60 + 5)).toBe('19:05');
  });
  it('깨진 값은 null', () => {
    expect(toMinutes('19시')).toBeNull();
  });
  it('하루를 넘기거나 음수면 감긴다', () => {
    expect(fromMinutes(1440)).toBe('00:00');
    expect(fromMinutes(1500)).toBe('01:00');
    expect(fromMinutes(-60)).toBe('23:00');
  });
});

describe('addHours', () => {
  it('종료 시각 자동 제안 (+2시간)', () => {
    expect(addHours('19:00', 2)).toBe('21:00');
    expect(addHours('19:30', 2)).toBe('21:30');
  });
  it('자정을 넘으면 감긴다', () => {
    expect(addHours('23:00', 2)).toBe('01:00');
  });
  it('깨진 값은 그대로', () => {
    expect(addHours('나중', 2)).toBe('나중');
  });
});

describe('snapMinute', () => {
  it('5분 눈금으로 내린다', () => {
    expect(snapMinute('19:23')).toBe('19:20');
    expect(snapMinute('19:00')).toBe('19:00');
    expect(snapMinute('19:59')).toBe('19:55');
  });
  it('깨진 값은 그대로', () => {
    expect(snapMinute('')).toBe('');
  });
});

describe('minuteOptions', () => {
  it('5분 단위 12칸', () => {
    expect(minuteOptions()).toEqual([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
  });
});

describe('isAfter', () => {
  it('같은 날 안에서만 판정한다', () => {
    expect(isAfter('19:00', '21:00')).toBe(true);
    expect(isAfter('19:00', '19:00')).toBe(false);
    expect(isAfter('21:00', '01:00')).toBe(false);
  });
  it('깨진 값은 false', () => {
    expect(isAfter('19:00', '')).toBe(false);
  });
});

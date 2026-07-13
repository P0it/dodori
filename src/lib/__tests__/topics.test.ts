import { topicSeqForDay } from '../topics';

describe('topicSeqForDay', () => {
  it('커플 생성 당일은 1번 주제', () => {
    expect(topicSeqForDay('2026-07-13', '2026-07-13', 120)).toBe(1);
  });
  it('하루 지나면 2번', () => {
    expect(topicSeqForDay('2026-07-13', '2026-07-14', 120)).toBe(2);
  });
  it('마지막 주제까지 순증', () => {
    expect(topicSeqForDay('2026-07-13', '2026-11-09', 120)).toBe(120); // 119일 경과
  });
  it('시드를 다 쓰면 1번으로 순환', () => {
    expect(topicSeqForDay('2026-07-13', '2026-11-10', 120)).toBe(1); // 120일 경과
  });
});

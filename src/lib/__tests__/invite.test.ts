import { inviteShareMessage, inviteUrl } from '../invite';

describe('inviteUrl — 초대 링크 조립', () => {
  it('베이스 URL 뒤에 /invite/코드를 붙인다', () => {
    expect(inviteUrl('https://dodori.app', 'ABCD123456')).toBe(
      'https://dodori.app/invite/ABCD123456',
    );
  });
  it('베이스 URL 끝 슬래시는 중복되지 않는다', () => {
    expect(inviteUrl('https://dodori.app/', 'ABCD123456')).toBe(
      'https://dodori.app/invite/ABCD123456',
    );
  });
  it('베이스 URL을 모르면 null', () => {
    expect(inviteUrl(null, 'ABCD123456')).toBeNull();
    expect(inviteUrl('', 'ABCD123456')).toBeNull();
  });
});

describe('inviteShareMessage — 공유 문구', () => {
  it('링크가 있으면 링크를 보낸다', () => {
    expect(inviteShareMessage('https://dodori.app/invite/ABCD123456', 'ABCD123456')).toContain(
      'https://dodori.app/invite/ABCD123456',
    );
  });
  it('링크가 없으면 코드를 안내한다', () => {
    expect(inviteShareMessage(null, 'ABCD123456')).toContain('ABCD123456');
  });
});

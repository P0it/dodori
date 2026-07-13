import { givenName } from '../name';

describe('givenName — 성 떼고 이름만', () => {
  it('3자 한글 이름은 성 한 글자를 뗀다', () => {
    expect(givenName('정현우')).toBe('현우');
    expect(givenName('김지현')).toBe('지현');
  });
  it('복성(4자)은 앞 두 글자를 뗀다', () => {
    expect(givenName('남궁민수')).toBe('민수');
    expect(givenName('선우재덕')).toBe('재덕');
  });
  it('복성이 아닌 4자는 그대로 (닉네임일 수 있음)', () => {
    expect(givenName('아메리카노')).toBe('아메리카노');
    expect(givenName('토끼와거북')).toBe('토끼와거북');
  });
  it('2자 이름·닉네임은 그대로', () => {
    expect(givenName('지현')).toBe('지현');
    expect(givenName('현우')).toBe('현우');
  });
  it('한글이 아니면 그대로', () => {
    expect(givenName('Hyunwoo')).toBe('Hyunwoo');
    expect(givenName('woo_92')).toBe('woo_92');
  });
});

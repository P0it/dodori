/**
 * 사람 이름 표기 — 성을 떼고 이름만 (친근함). '정현우' → '현우'
 * 한글 3~4자 이름에만 적용. 영문·닉네임·외자 이름은 그대로 둔다.
 */

/** 두 글자 성 (복성) — 이 경우 앞 2글자가 성 */
const TWO_CHAR_SURNAMES = [
  '남궁',
  '황보',
  '제갈',
  '사공',
  '선우',
  '서문',
  '독고',
  '동방',
  '망절',
  '무본',
  '소봉',
  '어금',
];

const HANGUL_ONLY = /^[가-힣]+$/;

export function givenName(fullName: string): string {
  const n = fullName.trim();
  if (!HANGUL_ONLY.test(n)) return n; // 영문·이모지 닉네임 등은 그대로
  if (n.length === 4 && TWO_CHAR_SURNAMES.includes(n.slice(0, 2))) return n.slice(2);
  if (n.length === 3) return n.slice(1);
  return n; // 2자(외자 이름) 이하, 5자 이상 닉네임은 그대로
}

/**
 * 초대 링크 — 웹 주소 하나로 보내고, 받는 쪽은 코드를 타이핑하지 않는다.
 * 앱이 깔려 있으면 같은 경로가 딥링크(dodori://invite/CODE)로도 열린다 (app.json scheme).
 */

/** 공유용 초대 링크. 베이스 URL을 모르면(네이티브 + env 미설정) null → 호출부가 코드만 보낸다 */
export function inviteUrl(baseUrl: string | null | undefined, code: string): string | null {
  if (!baseUrl) return null;
  return `${baseUrl.replace(/\/+$/, '')}/invite/${code}`;
}

/** 카톡 등으로 보낼 문구 — 링크가 있으면 링크를, 없으면 코드를 안내한다 */
export function inviteShareMessage(url: string | null, code: string): string {
  return url
    ? `dodori에서 함께 기록해요! 이 링크를 열면 연결돼요.\n${url}`
    : `dodori에서 함께 기록해요! 앱에서 이 초대 코드를 입력해줘: ${code}`;
}

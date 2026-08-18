import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * 웹 셸 — 네이티브에는 영향이 없다.
 *
 * 브라우저 확대(페이지 줌)는 끈다. 이 문서는 스크롤하지 않고(아래 overflow: hidden)
 * 안쪽 목록이 스크롤하는 구조라, 페이지가 확대되면 고정된 탭바·헤더와 안쪽 스크롤이 서로 싸워
 * 화면이 흔들린다. 확대가 필요한 곳은 각자 자기 사진만 키운다 (feed/PhotoZoom).
 * `touch-action: manipulation`은 더블탭 확대까지 막는다 — iOS 사파리는 user-scalable을 무시한다.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <ScrollViewStyleReset />
        {/*
          문서 자체는 스크롤하지 않는다 — 스크롤은 화면 안의 목록이 맡는다.
          이걸 풀어 두면 iOS Safari가 입력 칸을 보이겠다고 페이지를 통째로 밀어 올려
          (스토리 편집처럼) 화면에 못 박아 둔 사진까지 같이 올라간다
        */}
        <style
          dangerouslySetInnerHTML={{
            __html:
              'html, body { height: 100%; overflow: hidden; overscroll-behavior: none; }' +
              'body { touch-action: manipulation; }' +
              'body { background-color: #121212; }',
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

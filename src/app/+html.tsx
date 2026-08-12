import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * 웹 셸 — 네이티브에는 영향이 없다.
 *
 * `user-scalable=no`가 없으면 스토리 캔버스에서 사진을 오므릴 때 브라우저가 그 핀치를
 * 페이지 줌으로 가로채 앱 화면 전체가 확대·축소된다. (iOS Safari는 이 지시를 무시하므로
 * 캔버스 쪽의 `touch-action: none`이 함께 필요하다)
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
              'body { background-color: #121212; }',
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

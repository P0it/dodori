import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * 웹 셸 — 네이티브에는 영향이 없다.
 *
 * 브라우저 확대(핀치)는 열어 둔다 — 피드 사진을 자세히 보는 유일한 수단이 이것뿐이다.
 * 앱 안에서 핀치를 쓰는 곳(스토리 캔버스·게시물 크롭)은 자기 화면에서만 페이지 줌을 막는다
 * (`touch-action: none` + iOS Safari용 gesture* preventDefault — StoryCanvas 참고).
 * 대신 `touch-action: manipulation`으로 더블탭 확대만 끈다 — 확대는 남기고 탭 지연을 없앤다.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
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

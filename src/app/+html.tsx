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
              'body { background-color: #121212; }' +
              /*
                번들을 받는 동안의 스플래시 — 웹에는 네이티브 스플래시가 없어서, BrandSplash가
                마운트되기 전(번들 다운로드·실행)에는 배경색만 남은 검은 화면이 이어진다.
                마크를 HTML로 그려 첫 페인트에 띄우고, React가 뜨면 _layout.tsx가 이 노드를
                지운다. 좌표·크기는 BrandSplash의 MARK_SIZE 100 / DodoriMark 지오메트리와
                같은 값이라 교대하는 순간 그림이 안 바뀐다. (public/index.html과 같은 내용)
              */
              '#boot-splash { position: fixed; top: 0; left: 0; right: 0; height: 100%;' +
              /* 높이는 #root와 같은 규칙 — 고정 위치의 기준(큰 뷰포트)으로 두면 주소창이 보이는 동안 높이가 달라 마크가 튄다 */
              ' height: 100dvh; display: flex; align-items: center; justify-content: center;' +
              ' background-color: #121212; pointer-events: none; }' +
              '#boot-splash .mark { position: relative; width: 80px; height: 100px; }' +
              '#boot-splash span { position: absolute; background-color: #1ed760; }' +
              '#boot-splash .bar-a { left: 0; width: 22px; height: 100px; border-radius: 3px; }' +
              '#boot-splash .bar-b { left: 33px; width: 8.5px; height: 100px; border-radius: 3px; }' +
              '#boot-splash .dot { left: 54px; width: 26px; height: 26px; border-radius: 13px; }' +
              '#boot-splash .dot-up { top: 17px; }' +
              '#boot-splash .dot-low { top: 57px; }',
          }}
        />
      </head>
      <body>
        {children}
        <div id="boot-splash" aria-hidden="true">
          <div className="mark">
            <span className="bar-a" />
            <span className="bar-b" />
            <span className="dot dot-up" />
            <span className="dot dot-low" />
          </div>
        </div>
      </body>
    </html>
  );
}

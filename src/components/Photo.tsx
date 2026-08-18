import { Image, type ImageProps } from 'expo-image';
import { photoCacheKey, photoSource } from '@/lib/photoSource';

type Props = Omit<ImageProps, 'source' | 'recyclingKey' | 'cachePolicy' | 'placeholder'> & {
  /** 사진의 서명 URL */
  url: string;
  /**
   * 먼저 깔 저해상도 URL (grid 360 등) — 이미 캐시에 있으면 즉시 뜨고,
   * 본체가 도착하면 crossfade로 바뀐다. 없으면 그냥 본체만 기다린다.
   */
  lowUrl?: string | null;
};

/**
 * 사진 한 장 — 앱의 모든 사진은 이걸로 그린다 (`Image`를 직접 쓰지 않는다).
 *
 * expo-image에 직접 `source`를 넘기면 매번 세 가지를 같이 챙겨야 하는데, 하나라도 빠지면
 * 조용히 느려지기만 하고 아무 에러도 나지 않는다 — 그래서 한곳에 묶었다.
 *
 * 1. `cachePolicy` 기본값은 `'disk'`(메모리 캐시 없음)다. 탭을 옮겼다 돌아오거나 리스트가
 *    셀을 재활용할 때마다 디스크에서 다시 읽고 다시 디코드해서, 이미 받아 둔 사진인데도
 *    `transition` 페이드가 처음부터 다시 보인다. `memory-disk`로 그걸 없앤다.
 * 2. `recyclingKey` — FlashList가 셀을 재활용하면 새 사진이 도착할 때까지 **이전 셀의 사진이**
 *    그대로 남아 있다가 바뀐다(엉뚱한 사진이 한 번 스쳐 지나간다). 키가 바뀌면 즉시 비운다.
 * 3. `cacheKey` — 서명 토큰이 아니라 경로로 캐시를 맞춘다 (lib/photoSource).
 */
/**
 * 곧 볼 사진을 미리 받아 둔다 — 화면이 바뀐 뒤에 받기 시작하면 그 몇 백 ms가 빈 칸이 된다.
 *
 * **`Image.prefetch`를 쓰면 안 된다.** prefetch는 URL 문자열만 받아 캐시 키를 URL로 잡는데
 * (`ExpoImageModule.kt`의 `GlideUrl(it)`), 화면의 `Photo`는 `cacheKey`(경로)로 잡는다
 * — 키가 어긋나서 미리 받아 둔 게 화면에서 안 맞고 같은 사진을 두 번 내려받는다.
 * `loadAsync`는 `source`를 통째로 받아 `cacheKey`를 그대로 쓴다.
 *
 * 실패는 무시한다 — 미리 받기가 안 되면 화면에서 받으면 그만이다.
 */
export function prefetchPhotos(urls: (string | null | undefined)[]): void {
  for (const url of urls) {
    if (url) Image.loadAsync(photoSource(url)).catch(() => {});
  }
}

export function Photo({ url, lowUrl, ...rest }: Props) {
  return (
    <Image
      source={photoSource(url)}
      placeholder={lowUrl ? photoSource(lowUrl) : undefined}
      placeholderContentFit={rest.contentFit}
      recyclingKey={photoCacheKey(url)}
      cachePolicy="memory-disk"
      {...rest}
    />
  );
}

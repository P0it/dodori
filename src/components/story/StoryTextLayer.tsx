import { Text, View, type TextStyle } from 'react-native';
import { storyTextColor, typeface } from '@/theme/tokens';
import type { Rect, TextOverlay } from '@/lib/stories';

/**
 * 텍스트 스티커의 글자 모양 — 편집 화면과 뷰어가 똑같이 써야 "본 대로 저장"이 성립한다.
 * 크기는 사진 너비에 비례하므로 프레임이 커지든 작아지든 비중이 같다.
 */
export function overlayTextStyle(overlay: TextOverlay, rect: Rect): TextStyle {
  const fontSize = rect.width * overlay.size;
  return {
    fontFamily: typeface,
    fontWeight: '800',
    fontSize,
    lineHeight: fontSize * 1.25,
    color: storyTextColor[overlay.color],
    textAlign: 'center',
    maxWidth: rect.width * 0.9,
    // 밝은 사진 위에서도 흰 글자가 읽히도록
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  };
}

/** 사진 사각형 안에서의 중심 좌표 → 프레임 기준 이동량 */
export function overlayTransform(overlay: TextOverlay, rect: Rect) {
  return [
    { translateX: (overlay.x - 0.5) * rect.width },
    { translateY: (overlay.y - 0.5) * rect.height },
    { rotate: `${overlay.rotation}deg` },
  ];
}

type Props = {
  overlays: TextOverlay[];
  /** 프레임 안에서 사진이 실제로 차지하는 사각형 (lib/stories.containedRect) */
  rect: Rect;
};

/** 뷰어용 — 사진 위에 텍스트를 얹기만 한다 (터치를 먹지 않는다) */
export function StoryTextLayer({ overlays, rect }: Props) {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
    >
      {overlays.map((o) => (
        <View
          key={o.id}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
            transform: overlayTransform(o, rect),
          }}
        >
          <Text style={overlayTextStyle(o, rect)}>{o.text}</Text>
        </View>
      ))}
    </View>
  );
}

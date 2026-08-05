import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { color, space, typeface } from '@/theme/tokens';
import { StoryCanvas, type CanvasTransform } from '@/components/story/StoryCanvas';

const IDENTITY: CanvasTransform = { scale: 1, tx: 0, ty: 0 };

type Props = {
  photo: { uri: string; width: number; height: number } | null;
  /** 게시물 전체가 쓰는 프레임 비율(세로/가로) — 첫 사진이 정한다 (lib/posts postFrameRatioOf) */
  frameRatio: number;
  onCancel: () => void;
  onConfirm: (t: CanvasTransform) => void;
};

/**
 * 게시물 사진의 구도 잡기 — 프레임은 **게시물 비율**이다. 사진 제 비율이 아니라는 게 핵심으로,
 * 여기서 잡은 구도가 곧 피드 캐러셀에 보이는 그림이 된다 (표시 시점에 또 자르지 않는다).
 * 프레임 밖은 잘려 나가므로 오므려 키우거나 끌어서 무엇을 남길지 고른다.
 *
 * 스토리 편집기와 다른 점은 `minScale`이 1이라는 것뿐이다 — 게시물은 여백을 허용하지 않고
 * 항상 프레임을 꽉 채운다. 손대지 않으면 중앙 크롭이 그대로 저장된다.
 */
export function PostCropSheet({ photo, frameRatio, onCancel, onConfirm }: Props) {
  const { width } = useWindowDimensions();
  const [transform, setTransform] = useState<CanvasTransform>(IDENTITY);

  if (!photo) return null;
  const frameH = Math.round(width * frameRatio);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: color.bg }]}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <StoryCanvas
          uri={photo.uri}
          photoWidth={photo.width}
          photoHeight={photo.height}
          width={width}
          height={frameH}
          minScale={1}
          onChange={setTransform}
        />
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: space[4],
          paddingVertical: space[4],
        }}
      >
        <Pressable onPress={onCancel} hitSlop={10}>
          <Text style={{ fontFamily: typeface, fontSize: 16, color: color.sub }}>취소</Text>
        </Pressable>
        <Text style={{ fontFamily: typeface, fontSize: 13, color: color.muted }}>
          오므려 키우고 끌어서 맞춰요
        </Text>
        <Pressable onPress={() => onConfirm(transform)} hitSlop={10}>
          <Text
            style={{ fontFamily: typeface, fontWeight: '700', fontSize: 16, color: color.accent }}
          >
            완료
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

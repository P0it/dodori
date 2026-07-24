import { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  color,
  space,
  STORY_TEXT_COLOR_KEYS,
  storyTextColor,
  typeface,
  type StoryTextColorKey,
} from '@/theme/tokens';
import {
  containedRect,
  OVERLAY_SIZE_MAX,
  OVERLAY_SIZE_MIN,
} from '@/lib/stories';

export interface ComposedText {
  text: string;
  color: StoryTextColorKey;
  size: number;
}

type Props = {
  photoUri: string;
  photoWidth: number | null;
  photoHeight: number | null;
  initial: ComposedText;
  /** 기존 텍스트를 고치는 중이면 삭제가 붙는다 */
  onDelete?: () => void;
  onCancel: () => void;
  onDone: (value: ComposedText) => void;
};

const TRACK_HEIGHT = 190;

/**
 * 텍스트 입력 — 사진을 깔고 그 위에 실제 크기 그대로 쓴다.
 * 크기는 왼쪽 세로 슬라이더로 잡는다 (글자 위 핀치는 터치 영역이 글자만 해서 잡히지 않는다).
 */
export function TextComposer({
  photoUri,
  photoWidth,
  photoHeight,
  initial,
  onDelete,
  onCancel,
  onDone,
}: Props) {
  const [text, setText] = useState(initial.text);
  const [textColor, setTextColor] = useState<StoryTextColorKey>(initial.color);
  const [size, setSize] = useState(initial.size);
  const [frame, setFrame] = useState({ width: 0, height: 0 });

  // 스티커가 사진에 붙으므로 글자 크기 기준도 사진 너비 — 편집·뷰어가 같은 값을 쓴다
  const rect = containedRect(photoWidth, photoHeight, frame.width, frame.height);
  const fontSize = Math.max(12, rect.width * size);

  const ratio = (size - OVERLAY_SIZE_MIN) / (OVERLAY_SIZE_MAX - OVERLAY_SIZE_MIN);

  const setFromTrackY = (y: number) => {
    const t = 1 - Math.min(1, Math.max(0, y / TRACK_HEIGHT)); // 위가 크다
    setSize(OVERLAY_SIZE_MIN + t * (OVERLAY_SIZE_MAX - OVERLAY_SIZE_MIN));
  };
  const slider = Gesture.Pan()
    .onBegin((e) => setFromTrackY(e.y))
    .onChange((e) => setFromTrackY(e.y))
    .runOnJS(true);

  return (
    <Modal animationType="fade" onRequestClose={onCancel}>
      <View
        style={{ flex: 1, backgroundColor: '#000' }}
        onLayout={(e) => setFrame(e.nativeEvent.layout)}
      >
        <Image
          source={{ uri: photoUri }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.5 }}
          contentFit="contain"
        />

        {/* 입력 — 사진 한가운데, 실제로 찍힐 크기 그대로 */}
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 62 }}>
          <TextInput
            value={text}
            onChangeText={setText}
            autoFocus
            multiline
            placeholder="사진 위에 남길 말"
            placeholderTextColor="rgba(255,255,255,0.45)"
            style={{
              fontFamily: typeface,
              fontWeight: '800',
              fontSize,
              lineHeight: fontSize * 1.25,
              color: storyTextColor[textColor],
              textAlign: 'center',
              textShadowColor: 'rgba(0,0,0,0.45)',
              textShadowRadius: 6,
              textShadowOffset: { width: 0, height: 1 },
            }}
          />
        </View>

        {/* 크기 슬라이더 — 위가 크다 */}
        <GestureDetector gesture={slider}>
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              marginTop: -TRACK_HEIGHT / 2,
              width: 54,
              height: TRACK_HEIGHT,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 4,
                height: TRACK_HEIGHT,
                borderRadius: 2,
                backgroundColor: 'rgba(255,255,255,0.35)',
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: (1 - ratio) * TRACK_HEIGHT - 11,
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: color.white,
              }}
            />
          </View>
        </GestureDetector>

        {/* 상단 — 취소 / 삭제 / 완료 */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            flexDirection: 'row',
            alignItems: 'center',
            gap: space[4],
            paddingHorizontal: space[4],
            paddingVertical: space[3],
          }}
        >
          <Pressable hitSlop={10} onPress={onCancel}>
            <Text style={{ fontFamily: typeface, fontSize: 14.5, color: 'rgba(255,255,255,0.8)' }}>
              취소
            </Text>
          </Pressable>
          <View style={{ flex: 1 }} />
          {onDelete && (
            <Pressable hitSlop={10} onPress={onDelete}>
              <Text style={{ fontFamily: typeface, fontSize: 14.5, color: color.danger }}>삭제</Text>
            </Pressable>
          )}
          <Pressable
            hitSlop={10}
            onPress={() => onDone({ text: text.trim(), color: textColor, size })}
            disabled={!text.trim()}
          >
            <Text
              style={{
                fontFamily: typeface,
                fontWeight: '800',
                fontSize: 15,
                color: color.white,
                opacity: text.trim() ? 1 : 0.4,
              }}
            >
              완료
            </Text>
          </Pressable>
        </View>

        {/* 하단 — 색 */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'center',
            paddingHorizontal: space[4],
            paddingVertical: space[4],
          }}
        >
          {STORY_TEXT_COLOR_KEYS.map((key) => (
            <Pressable
              key={key}
              onPress={() => setTextColor(key)}
              hitSlop={6}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: storyTextColor[key],
                borderWidth: key === textColor ? 3 : 1,
                borderColor: key === textColor ? color.white : 'rgba(255,255,255,0.35)',
              }}
            />
          ))}
        </View>
      </View>
    </Modal>
  );
}

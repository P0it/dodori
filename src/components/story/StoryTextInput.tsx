import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
import { OVERLAY_SIZE_MAX, OVERLAY_SIZE_MIN } from '@/lib/stories';

export interface ComposedText {
  text: string;
  color: StoryTextColorKey;
  size: number;
}

type Props = {
  initial: ComposedText;
  /** 캔버스 너비 — 글자 크기가 캔버스 대비 비율이라 실제 크기를 여기서 낸다 */
  canvasWidth: number;
  /** 뒤에 깔 사진 — 흐리게 눌러서 배경으로만 남긴다 */
  photoUri: string;
  onDelete: () => void;
  /** 딤을 탭하거나 완료 — 내용이 비어 있으면 부르는 쪽이 오버레이를 지운다 */
  onDone: (value: ComposedText) => void;
};

const TRACK_HEIGHT = 190;

/** 상단 삭제·완료 줄이 먹는 높이 — 글자가 그 아래에서 시작하게 */
const TOP_BAR_HEIGHT = 52;

/** 편집 중에만 쓰는 배경 — 사진을 알아볼 정도로만 남기고 글자를 앞으로 세운다 */
const EDIT_BACKDROP = { blurRadius: 44, scrim: 'rgba(0,0,0,0.55)' } as const;

/**
 * 텍스트 편집 — 화면 전체가 입력으로 바뀐다 (인스타와 같다).
 *
 * 사진은 흐려져 배경으로만 남고, 그 위에서 바로 친다. 상자를 그리지 않으니
 * 몇 줄이 되든 화면이 곧 입력 칸이다 — 길어지면 세로로 스크롤되고,
 * 배경을 탭하면 편집이 끝나 곧바로 끌고 오므릴 수 있는 스티커가 된다.
 */
export function StoryTextInput({ initial, canvasWidth, photoUri, onDelete, onDone }: Props) {
  const [text, setText] = useState(initial.text);
  const [textColor, setTextColor] = useState<StoryTextColorKey>(initial.color);
  const [size, setSize] = useState(initial.size);

  const fontSize = Math.max(12, canvasWidth * size);
  const ratio = (size - OVERLAY_SIZE_MIN) / (OVERLAY_SIZE_MAX - OVERLAY_SIZE_MIN);

  const done = () => onDone({ text: text.trim(), color: textColor, size });

  const setFromTrackY = (y: number) => {
    const t = 1 - Math.min(1, Math.max(0, y / TRACK_HEIGHT)); // 위가 크다
    setSize(OVERLAY_SIZE_MIN + t * (OVERLAY_SIZE_MAX - OVERLAY_SIZE_MIN));
  };
  const slider = Gesture.Pan()
    .onBegin((e) => setFromTrackY(e.y))
    .onChange((e) => setFromTrackY(e.y))
    .runOnJS(true);

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* 배경 — 사진을 흐리게 눌러 둔다. 탭하면 편집이 끝난다 */}
      <Image
        source={{ uri: photoUri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        blurRadius={EDIT_BACKDROP.blurRadius}
      />
      <Pressable
        onPress={done}
        style={[StyleSheet.absoluteFill, { backgroundColor: EDIT_BACKDROP.scrim }]}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        pointerEvents="box-none"
      >
        {/*
          글자 — 키보드를 피해 위쪽에. 짧으면 가운데, 길어지면 스크롤된다.
          예전엔 가운데 정렬한 고정 높이 상자라 세 줄이 넘어가면 첫 줄이
          위로 밀려 나가 사라진 것처럼 보였다
        */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: TOP_BAR_HEIGHT,
            paddingBottom: space[4],
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >
          {/* 글자 옆 빈 곳을 탭해도 편집이 끝난다 — 스크롤뷰가 딤을 덮고 있어서 */}
          <Pressable
            onPress={done}
            style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 62 }}
          >
            <TextInput
              value={text}
              onChangeText={setText}
              autoFocus
              multiline
              scrollEnabled={false}
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
          </Pressable>
        </ScrollView>

        {/* 색 — 키보드 바로 위 */}
        <View
          style={{
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
      </KeyboardAvoidingView>

      {/* 크기 슬라이더 — 위가 크다 */}
      <GestureDetector gesture={slider}>
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: '30%',
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

      {/* 상단 — 삭제 / 완료 */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: space[4],
          paddingVertical: space[3],
        }}
      >
        <Pressable hitSlop={10} onPress={onDelete}>
          <Text style={{ fontFamily: typeface, fontSize: 14.5, color: color.danger }}>삭제</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable hitSlop={10} onPress={done}>
          <Text
            style={{ fontFamily: typeface, fontWeight: '800', fontSize: 15, color: color.white }}
          >
            완료
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
  onDelete: () => void;
  /** 완료 — 내용이 비어 있으면 부르는 쪽이 오버레이를 지운다 */
  onDone: (value: ComposedText) => void;
};

const TRACK_HEIGHT = 190;

/** 상단 삭제·완료 줄이 먹는 높이 — 글자가 그 아래에서 시작하게 */
const TOP_BAR_HEIGHT = 52;

/** 입력 중 사진을 한 겹 누르는 정도 — 사진이 뭔지 알아볼 만큼만 */
const EDIT_DIM = 'rgba(0,0,0,0.35)';

/**
 * 텍스트 편집 — 화면 전체가 입력 칸이다.
 *
 * 뒤에 깔린 편집 캔버스(고른 비율 그대로의 사진)를 한 겹 어둡게만 누른다.
 * 흐린 사본을 덮어씌우지 않는 게 요점이다 — cover로 그리는 순간 고른 비율이 무시되고
 * 사진이 확대돼 버린다.
 * 상자를 그리지 않으니 몇 줄이 되든 화면이 곧 입력 칸이고, 길어지면 세로로 스크롤된다.
 * 화면을 한 번 더 탭하면 편집이 끝난다 — 상단의 완료·삭제와 같은 길이다.
 */
export function StoryTextInput({ initial, canvasWidth, onDelete, onDone }: Props) {
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
      {/*
        사진을 한 겹 눌러 둔다 — 지금은 글자를 치는 시간이라는 표시다.
        사진 자체는 그대로다: 흐리게도, 키우지도 않는다. 이 겹은 터치를 먹지 않는다
      */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: EDIT_DIM }]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        pointerEvents="box-none"
      >
        {/*
          입력 칸이 곧 화면이다 — 높이를 내용에 맡기지 않고 남은 자리를 통째로 차지한다.
          내용에 맡기면(자동 높이) 웹의 textarea가 기본 두어 줄로 서서 세 줄만 넘어도
          첫 줄이 밀려 나가 사라졌다. 넘치는 줄은 입력 칸 안에서 스크롤된다
        */}
        <TextInput
          value={text}
          onChangeText={setText}
          autoFocus
          multiline
          textAlignVertical="center"
          placeholder="사진 위에 남길 말"
          placeholderTextColor="rgba(255,255,255,0.45)"
          style={{
            flex: 1,
            paddingTop: TOP_BAR_HEIGHT,
            paddingBottom: space[4],
            paddingHorizontal: 62,
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

        {/*
          입력 칸 위에 덮은 투명한 한 겹 — 한 번 더 탭하면 편집에서 빠져나온다.
          입력 칸이 화면을 다 먹으니 "글자 밖" 이라는 자리가 없어서, 나가는 길을
          이 겹이 대신 맡는다. 커서를 탭으로 옮기지는 못하지만 인스타도 같다.
          색 고르기 줄은 이 뒤에 그려서 여전히 눌린다
        */}
        <Pressable onPress={done} style={StyleSheet.absoluteFill} />

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

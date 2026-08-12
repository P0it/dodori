import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import {
  color,
  space,
  STORY_TEXT_COLOR_KEYS,
  storyTextColor,
  typeface,
  type StoryTextColorKey,
} from '@/theme/tokens';
import { OVERLAY_WIDTH_RATIO } from '@/lib/stories';
import { TrashGlyph } from '@/components/glyphs';

export interface ComposedText {
  text: string;
  color: StoryTextColorKey;
  size: number;
}

type Props = {
  initial: ComposedText;
  /** 캔버스 너비 — 글자 크기가 캔버스 대비 비율이라 실제 크기를 여기서 낸다 */
  canvasWidth: number;
  /** 캔버스(카드) 높이 — 글자가 놓일 자리와 넘치기 시작하는 지점을 여기서 낸다 */
  canvasHeight: number;
  /** 화면 상자 높이 — 카드보다 길 수 있다. 카드 밖을 탭해도 나가지도록 여기까지 덮는다 */
  boxHeight: number;
  /** 버리기 — 이 글자를 아예 없앤다 */
  onDelete: () => void;
  /** 완료 — 내용이 비어 있으면 부르는 쪽이 오버레이를 지운다 */
  onDone: (value: ComposedText) => void;
};

/** 입력 중 사진을 한 겹 누르는 정도 — 사진이 뭔지 알아볼 만큼만 */
const EDIT_DIM = 'rgba(0,0,0,0.35)';

/**
 * 텍스트 편집 — 화면 전체가 입력 칸이다.
 *
 * 뒤에 깔린 편집 캔버스(고른 비율 그대로의 사진)를 한 겹 어둡게만 누른다.
 * 흐린 사본을 덮어씌우지 않는 게 요점이다 — cover로 그리는 순간 고른 비율이 무시되고
 * 사진이 확대돼 버린다.
 *
 * **치는 자리 = 놓일 자리다.** 입력 칸은 키보드를 피해 위로 밀려나지 않고 화면
 * 한가운데에 못 박혀 있다 — 새 글자가 캔버스 정중앙(y=0.5)에 놓이니, 위에서 치다가
 * 완료하면 가운데로 뛰어내리던 어긋남이 없다. 도구(버리기·색)는 키보드가 닿지 않는 위쪽에 둔다.
 *
 * 나가는 길은 **글자 밖 탭 하나**다 (= 완료). 그래서 완료 버튼이 따로 없다.
 * 위치·크기·기울기는 나간 뒤 손가락으로 잡는다.
 */
export function StoryTextInput({
  initial,
  canvasWidth,
  canvasHeight,
  boxHeight,
  onDelete,
  onDone,
}: Props) {
  const [text, setText] = useState(initial.text);
  const [textColor, setTextColor] = useState<StoryTextColorKey>(initial.color);
  const [selection, setSelection] = useState<{ start: number; end: number } | undefined>(() =>
    initial.text ? { start: initial.text.length, end: initial.text.length } : undefined,
  );

  const fontSize = Math.max(12, canvasWidth * initial.size);
  const lineHeight = fontSize * 1.25;

  /**
   * 입력 칸 높이는 내용을 따라간다 — 한 줄이면 한 줄만 차지해야 그 줄이 화면
   * 한가운데에 선다. 플랫폼마다 multiline의 기본 높이가 제각각이라(웹 textarea는
   * 두어 줄) 재서 쓴다. 넘치면 화면의 6할에서 멈추고 안에서 스크롤된다
   */
  const [contentHeight, setContentHeight] = useState(lineHeight);
  const height = Math.min(Math.max(contentHeight, lineHeight), canvasHeight * 0.6);

  const done = () => onDone({ text: text.trim(), color: textColor, size: initial.size });

  return (
    /*
      크기를 화면 상자에 못 박는다 — bottom:0에 맡기면 안드로이드에서 키보드가 뜰 때
      창이 줄면서 이 겹도 같이 줄고, 가운데가 위로 올라가 버린다
    */
    <View style={{ position: 'absolute', top: 0, left: 0, width: canvasWidth, height: boxHeight }}>
      {/*
        사진(카드)만 한 겹 눌러 둔다 — 지금은 글자를 치는 시간이라는 표시다.
        사진 자체는 그대로다: 흐리게도, 키우지도 않는다. 이 겹은 터치를 먹지 않는다
      */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: canvasHeight,
          backgroundColor: EDIT_DIM,
        }}
      />

      {/*
        글자 **밖**을 한 번 탭하면 그게 완료다. 입력 칸보다 먼저 그려서 아래에 깔린다 —
        위에 덮으면 글자를 눌러 커서를 옮기는 것까지 완료로 먹혀 버린다.
        색 고르기 줄은 뒤에 그려서 이 겹 위에 온다
      */}
      <Pressable onPress={done} style={StyleSheet.absoluteFill} />

      {/* 글자는 카드 한가운데에 — 나가면 놓일 그 자리다 */}
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: canvasHeight, justifyContent: 'center' }}
        pointerEvents="box-none"
      >
        <TextInput
          value={text}
          onChangeText={setText}
          onContentSizeChange={(e) => setContentHeight(e.nativeEvent.contentSize.height)}
          /*
            고치러 들어왔으면 커서는 글자 끝이다 — 맨 앞에 서 있으면 뒤에 이어 쓰려고
            글자 뒤를 탭하게 되고, 그건 편집을 나가는 손짓이다.
            첫 선택 뒤에는 손을 뗀다(undefined) — 계속 붙들고 있으면 한글 조합이 끊긴다
          */
          selection={selection}
          onSelectionChange={() => setSelection(undefined)}
          autoFocus
          multiline
          placeholder="사진 위에 남길 말"
          placeholderTextColor="rgba(255,255,255,0.45)"
          style={{
            height,
            // 뷰어·편집 레이어와 같은 폭이라야 치는 동안의 줄바꿈이 완료 후에도 그대로다
            width: canvasWidth * OVERLAY_WIDTH_RATIO,
            alignSelf: 'center',
            paddingHorizontal: 0,
            paddingVertical: 0,
            fontFamily: typeface,
            fontWeight: '800',
            fontSize,
            lineHeight,
            color: storyTextColor[textColor],
            textAlign: 'center',
            textShadowColor: 'rgba(0,0,0,0.45)',
            textShadowRadius: 6,
            textShadowOffset: { width: 0, height: 1 },
          }}
        />
      </View>

      {/* 버리기 — 글자를 다 지우고 나가는 길의 지름길. 오른쪽 위, 다른 도구 버튼과 같은 원 */}
      <Pressable
        onPress={onDelete}
        hitSlop={8}
        style={({ pressed }) => ({
          position: 'absolute',
          top: space[2],
          right: space[4],
          width: 38,
          height: 38,
          borderRadius: 19,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.45)',
          opacity: pressed ? 0.75 : 1,
        })}
      >
        <TrashGlyph size={20} color={color.white} />
      </Pressable>

      {/*
        색 — 버리기 버튼 바로 아래, 화면 위쪽이다.
        키보드 위에 두려면 키보드 높이를 재야 하는데 그 방법이 플랫폼마다 다르고
        (웹의 Keyboard는 빈 껍데기다) 어느 한쪽에서 어긋나면 색을 아예 못 고른다.
        위는 무엇으로도 가려지지 않는 자리다
      */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: space[2] + 38 + space[3],
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 12,
          justifyContent: 'center',
          paddingHorizontal: space[4],
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
  );
}

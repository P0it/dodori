import { useEffect, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  color,
  space,
  STORY_TEXT_COLOR_KEYS,
  storyTextColor,
  typeface,
  type StoryTextColorKey,
} from '@/theme/tokens';

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
  /** 화면 상자 높이 — 카드보다 길 수 있다. 색 고르기 줄은 이 바닥을 기준으로 앉는다 */
  boxHeight: number;
  /** 완료 — 내용이 비어 있으면 부르는 쪽이 오버레이를 지운다 */
  onDone: (value: ComposedText) => void;
};

/** 입력 중 사진을 한 겹 누르는 정도 — 사진이 뭔지 알아볼 만큼만 */
const EDIT_DIM = 'rgba(0,0,0,0.35)';

/**
 * 키보드 위에 두는 여유. iOS는 키보드 위에 시스템 도구줄(^ ∨ 완료)이 한 겹 더 붙는데
 * 그 높이는 `endCoordinates`에 잡히지 않을 때가 있다 — 색 고르기 줄이 그 아래로 깔리면
 * 색을 아예 고를 수 없어서, 그 줄만큼 넉넉히 띄운다
 */
const KEYBOARD_CLEARANCE = Platform.OS === 'ios' ? 52 : space[3];

/**
 * 텍스트 편집 — 화면 전체가 입력 칸이다.
 *
 * 뒤에 깔린 편집 캔버스(고른 비율 그대로의 사진)를 한 겹 어둡게만 누른다.
 * 흐린 사본을 덮어씌우지 않는 게 요점이다 — cover로 그리는 순간 고른 비율이 무시되고
 * 사진이 확대돼 버린다.
 *
 * **치는 자리 = 놓일 자리다.** 입력 칸은 키보드를 피해 위로 밀려나지 않고 화면
 * 한가운데에 못 박혀 있다 — 새 글자가 캔버스 정중앙(y=0.5)에 놓이니, 위에서 치다가
 * 완료하면 가운데로 뛰어내리던 어긋남이 없다. 키보드를 피하는 건 색 고르기 줄뿐이다.
 *
 * 나가는 길은 **배경 탭 하나**다 (= 완료). 글자를 다 지우고 나가면 부르는 쪽이 지운다 —
 * 그래서 완료·삭제 버튼이 따로 없다. 위치·크기·기울기는 나간 뒤 손가락으로 잡는다.
 */
export function StoryTextInput({
  initial,
  canvasWidth,
  canvasHeight,
  boxHeight,
  onDone,
}: Props) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState(initial.text);
  const [textColor, setTextColor] = useState<StoryTextColorKey>(initial.color);

  const fontSize = Math.max(12, canvasWidth * initial.size);
  const lineHeight = fontSize * 1.25;

  /**
   * 입력 칸 높이는 내용을 따라간다 — 한 줄이면 한 줄만 차지해야 그 줄이 화면
   * 한가운데에 선다. 플랫폼마다 multiline의 기본 높이가 제각각이라(웹 textarea는
   * 두어 줄) 재서 쓴다. 넘치면 화면의 6할에서 멈추고 안에서 스크롤된다
   */
  const [contentHeight, setContentHeight] = useState(lineHeight);
  const height = Math.min(Math.max(contentHeight, lineHeight), canvasHeight * 0.6);

  // 색 고르기 줄만 키보드 위로 올린다 (기준은 줄어들지 않는 캔버스라 높이를 그대로 더한다)
  const [keyboard, setKeyboard] = useState(0);
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (e) =>
      setKeyboard(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () =>
      setKeyboard(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

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

      {/* 글자는 카드 한가운데에 — 나가면 놓일 그 자리다 */}
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: canvasHeight, justifyContent: 'center' }}
        pointerEvents="box-none"
      >
        <TextInput
          value={text}
          onChangeText={setText}
          onContentSizeChange={(e) => setContentHeight(e.nativeEvent.contentSize.height)}
          autoFocus
          multiline
          placeholder="사진 위에 남길 말"
          placeholderTextColor="rgba(255,255,255,0.45)"
          style={{
            height,
            paddingHorizontal: 62,
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

      {/*
        입력 칸 위에 덮은 투명한 한 겹 — 한 번 탭하면 그게 완료다.
        커서를 탭으로 옮기지는 못하지만 인스타도 같다.
        색 고르기 줄은 이 뒤에 그려서 여전히 눌린다
      */}
      <Pressable onPress={done} style={StyleSheet.absoluteFill} />

      {/* 색 — 키보드 바로 위 */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: (keyboard || insets.bottom) + KEYBOARD_CLEARANCE,
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

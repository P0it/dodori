import { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import {
  color,
  radius,
  space,
  STORY_TEXT_COLOR_KEYS,
  storyTextColor,
  typeface,
  type StoryTextColorKey,
} from '@/theme/tokens';

type Props = {
  /** 고칠 텍스트 — 새로 넣는 중이면 빈 문자열 */
  initialText: string;
  initialColor: StoryTextColorKey;
  /** 기존 텍스트를 고치는 중이면 삭제 버튼이 붙는다 */
  onDelete?: () => void;
  onCancel: () => void;
  onDone: (text: string, color: StoryTextColorKey) => void;
};

/** 텍스트 내용·색 입력 — 사진 위 배치는 편집 레이어가, 내용은 여기가 맡는다 */
export function TextComposer({ initialText, initialColor, onDelete, onCancel, onDone }: Props) {
  const [text, setText] = useState(initialText);
  const [textColor, setTextColor] = useState<StoryTextColorKey>(initialColor);

  return (
    <Modal transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)' }} onPress={onCancel} />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: space[4],
          gap: space[3],
          borderTopLeftRadius: radius.sheet,
          borderTopRightRadius: radius.sheet,
          backgroundColor: color.surface1,
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          autoFocus
          multiline
          placeholder="사진 위에 남길 말"
          placeholderTextColor={color.muted}
          style={{
            minHeight: 56,
            maxHeight: 140,
            borderRadius: radius.field,
            backgroundColor: color.surface2,
            padding: 14,
            fontFamily: typeface,
            fontWeight: '700',
            fontSize: 17,
            color: storyTextColor[textColor],
            textAlignVertical: 'top',
          }}
        />

        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
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
                borderWidth: key === textColor ? 2.5 : 1,
                borderColor: key === textColor ? color.white : color.surface3,
              }}
            />
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: space[2] }}>
          {onDelete && (
            <Pressable
              onPress={onDelete}
              style={({ pressed }) => ({
                height: 48,
                paddingHorizontal: 18,
                borderRadius: radius.pill,
                backgroundColor: color.surface2,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 14.5, color: color.danger }}>
                삭제
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => onDone(text, textColor)}
            disabled={!text.trim()}
            style={({ pressed }) => ({
              flex: 1,
              height: 48,
              borderRadius: radius.pill,
              backgroundColor: color.accent,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !text.trim() ? 0.4 : pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 15, color: color.onPrimary }}>
              확인
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

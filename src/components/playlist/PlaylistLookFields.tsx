import { Pressable, Text, TextInput, View } from 'react-native';
import { color, typeface, eventColor, EVENT_COLOR_KEYS } from '@/theme/tokens';
import { PlaylistTile, PLAYLIST_ICON_KEYS } from './PlaylistTile';

/** 리스트의 이름·색·아이콘 입력 — 새로 만들 때와 수정할 때가 같은 화면을 쓴다. props-only */
export function PlaylistLookFields({
  name,
  onChangeName,
  colorKey,
  onChangeColor,
  icon,
  onChangeIcon,
  autoFocus = false,
  onSubmitEditing,
}: {
  name: string;
  onChangeName: (v: string) => void;
  colorKey: string;
  onChangeColor: (v: string) => void;
  icon: string | null;
  onChangeIcon: (v: string | null) => void;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
}) {
  return (
    <View>
      <TextInput
        value={name}
        onChangeText={onChangeName}
        autoFocus={autoFocus}
        placeholder="Cafe"
        placeholderTextColor={color.muted}
        onSubmitEditing={onSubmitEditing}
        style={{
          textAlign: 'center',
          fontFamily: typeface,
          fontWeight: '800',
          fontSize: 26,
          letterSpacing: -0.4,
          color: color.white,
          paddingBottom: 16,
          borderBottomWidth: 1.5,
          borderBottomColor: color.surface3,
        }}
      />

      <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 13, color: color.sub, marginTop: 26, marginBottom: 12 }}>
        색
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        {EVENT_COLOR_KEYS.map((k) => (
          <Pressable
            key={k}
            onPress={() => onChangeColor(k)}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: eventColor[k].fg,
              borderWidth: 3,
              borderColor: k === colorKey ? color.white : 'transparent',
            }}
          />
        ))}
      </View>

      <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 13, color: color.sub, marginTop: 24, marginBottom: 12 }}>
        아이콘
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {PLAYLIST_ICON_KEYS.map((key) => {
          const selected = key === icon;
          return (
            <Pressable
              key={key}
              onPress={() => onChangeIcon(selected ? null : key)}
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: selected ? color.accent : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PlaylistTile colorKey={colorKey} icon={key} name="" size={44} radius={10} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

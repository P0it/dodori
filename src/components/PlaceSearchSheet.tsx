import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { color, typeface } from '@/theme/tokens';
import { usePlaceSearch, type SearchPlace } from '@/api/places';
import { Meta } from '@/components/Meta';
import { PlaceKindTile } from '@/components/PlaceKindTile';

/**
 * 장소 하나 고르기 — 네이버 검색(search-places Edge Function) 결과에서 한 곳.
 * 여러 곳을 담는 `modals/place-search`(장바구니식)와 달리 고르는 즉시 닫히고 값을 돌려준다.
 * 화면을 떠나지 않는 시트인 이유: expo-router는 띄운 화면에서 값을 돌려받는 길이 없다.
 */
export function PlaceSearchSheet({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (place: SearchPlace) => void;
}) {
  const [query, setQuery] = useState('');
  const search = usePlaceSearch(query);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} onPress={onClose} />
      <View
        style={{
          height: '72%',
          backgroundColor: color.surface1,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 20,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 16, color: color.white }}>
            장소 찾기
          </Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.sub }}>닫기</Text>
          </Pressable>
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          autoFocus
          placeholder="카페, 맛집, 장소 검색"
          placeholderTextColor={color.muted}
          returnKeyType="search"
          style={{
            height: 44,
            borderRadius: 8,
            backgroundColor: color.surface2,
            paddingHorizontal: 14,
            color: color.white,
            fontFamily: typeface,
            fontSize: 15,
          }}
        />

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingVertical: 8 }}>
          {query.trim().length < 2 ? (
            <Meta style={{ paddingVertical: 14 }}>두 글자 이상 입력하면 찾아볼게요.</Meta>
          ) : search.isPending ? (
            <ActivityIndicator color={color.accent} style={{ marginTop: 20 }} />
          ) : search.isError ? (
            <Meta style={{ paddingVertical: 14 }}>{String(search.error.message)}</Meta>
          ) : (search.data ?? []).length === 0 ? (
            <Meta style={{ paddingVertical: 14 }}>찾는 곳이 없어요. 다르게 검색해보세요.</Meta>
          ) : (
            (search.data ?? []).map((p) => (
              <Pressable
                key={p.naver_id}
                onPress={() => onSelect(p)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 12,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <PlaceKindTile category={p.category} size={28} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.white }}>
                    {p.name}
                  </Text>
                  <Meta style={{ marginTop: 2, fontSize: 12 }}>
                    {[p.category, p.address].filter(Boolean).join(' · ')}
                  </Meta>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

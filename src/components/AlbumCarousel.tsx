import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { color, typeface } from '@/theme/tokens';
import { formatDday, isReleased } from '@/lib/date';
import { AlbumJacket } from '@/components/AlbumJacket';
import { Dday } from '@/components/Dday';

export type CarouselAlbum = {
  id: string;
  title: string;
  date: string;
  coverThumbUrl: string | null;
};

const CARD = 176;
/** 캐러셀 좌우 여백 — 이웃 카드가 이 안쪽에 머문다 */
const GUTTER = 20;
/** 이웃이 가운데 뒤로 파고들 최소 폭 */
const MIN_OVERLAP = 34;

/**
 * 앨범 캐러셀 — 가운데가 현재, 왼쪽이 지난 데이트·오른쪽이 앞으로의 데이트.
 * 이웃은 뒤로 겹쳐 들어가며 작고 연하게 깔린다. 스크롤하면 STEP 단위로 스냅되고
 * 가운데 온 앨범이 활성으로 바뀐다. 사진 없는 앨범은 생성 자켓으로 채운다.
 */
export function AlbumCarousel({
  albums,
  focusIndex,
  onPress,
  onCreate,
}: {
  albums: CarouselAlbum[];
  focusIndex: number;
  onPress: (id: string) => void;
  onCreate: () => void;
}) {
  const ref = useRef<ScrollView>(null);
  const { width: screen } = useWindowDimensions();
  const [active, setActive] = useState(focusIndex);
  // 앨범들 뒤에 "새 데이트" 빈 슬롯 한 장 — 마지막 칸은 앨범이 아니다
  const total = albums.length + 1;
  const side = Math.max(0, (screen - CARD) / 2);
  // 이웃 카드의 바깥 가장자리가 GUTTER 안쪽에 오도록 보폭을 잡는다 (화면 밖으로 나가지 않게)
  const step = Math.min(CARD - MIN_OVERLAP, Math.max(CARD * 0.5, side - GUTTER));
  const overlap = CARD - step;

  // 마운트·포커스 변경 시 해당 앨범을 가운데로
  const centerX = focusIndex * step;
  useEffect(() => {
    setActive(focusIndex);
    ref.current?.scrollTo({ x: centerX, animated: false });
  }, [focusIndex, albums.length, step, centerX]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / step);
    if (i !== active && i >= 0 && i < total) setActive(i);
  };

  const current = albums[active];

  return (
    <View>
      {/* contentContainerStyle 세로 여백을 넉넉히 — 활성 카드 글로우가 스크롤뷰 경계(제목 영역)에서 잘리지 않게 */}
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        // 위 effect의 scrollTo는 콘텐츠가 아직 안 깔린 프레임에 나가면 0으로 잘린다
        // (마운트 직후·앨범 추가 직후). 실제 콘텐츠 폭이 잡힐 때 한 번 더 가운데로 보낸다.
        onContentSizeChange={() => ref.current?.scrollTo({ x: centerX, animated: false })}
        contentContainerStyle={{ paddingHorizontal: side, paddingVertical: 42 }}
      >
        {albums.map((a, i) => {
          const dist = Math.abs(i - active);
          const isActive = dist === 0;
          const upcoming = !isReleased(a.date);
          return (
            <Pressable
              key={a.id}
              onPress={() => onPress(a.id)}
              style={{
                width: CARD,
                height: CARD,
                marginRight: -overlap,
                // 가운데가 맨 위, 멀어질수록 뒤로
                zIndex: total - dist,
                opacity: isActive ? 1 : Math.max(0.25, 0.5 - (dist - 1) * 0.12),
                transform: [{ scale: isActive ? 1 : Math.max(0.76, 0.86 - (dist - 1) * 0.05) }],
              }}
            >
              {/*
                검정 배경 위에선 검은 그림자가 안 보인다 — 어두운 테마의 "부양"은 연한 빛으로 준다.
                가운데(활성) 카드만 소프트 글로우로 띄운다. clip은 안쪽 뷰가 맡아 글로우가 안 잘린다.
              */}
              <View
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 6,
                  backgroundColor: color.surface2,
                  boxShadow: isActive ? '0px 10px 36px 4px rgba(255,255,255,0.24)' : undefined,
                }}
              >
                <View style={{ width: '100%', height: '100%', borderRadius: 6, overflow: 'hidden' }}>
                  {a.coverThumbUrl ? (
                    <Image source={a.coverThumbUrl} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : (
                    <AlbumJacket seed={a.id} date={a.date} title={a.title} size={CARD} />
                  )}
                  {/* 제목·날짜가 위쪽을 쓰므로 D-day는 아래로 */}
                  {upcoming && isActive && (
                    <View style={{ position: 'absolute', left: 8, bottom: 8 }}>
                      <Dday tone="accent">{formatDday(a.date)}</Dday>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          );
        })}

        {/* 꼬리의 빈 앨범 — "한 장 더 꽂는다". 활성 글로우는 주지 않는다(앨범이 아니므로) */}
        <NewAlbumSlot
          dist={Math.abs(albums.length - active)}
          onPress={onCreate}
        />
      </ScrollView>

      {/* 제목은 가운데 카드 것만 — 카드가 겹쳐 있어 카드마다 달 수 없다.
          빈 슬롯이 가운데일 때도 같은 자리를 채운다(비우면 아래 내용이 들썩인다) */}
      <View style={{ alignItems: 'center', marginTop: 4, paddingHorizontal: 16 }}>
        {/* 이 탭의 주인공 — 섹션 헤더(19)보다 커야 자켓에서 이어진 무게가 끊기지 않는다 */}
        <Text
          numberOfLines={1}
          style={{
            fontFamily: typeface,
            fontWeight: '800',
            fontSize: 21,
            letterSpacing: -0.4,
            color: color.white,
          }}
        >
          {current ? current.title : '새 데이트'}
        </Text>
        <Text style={{ marginTop: 3, fontFamily: typeface, fontWeight: '500', fontSize: 13, color: color.muted }}>
          {current ? current.date.slice(5).replace('-', '.') : '탭해서 만들기'}
        </Text>
      </View>
    </View>
  );
}

/** 캐러셀 꼬리의 빈 앨범 — 실제 앨범과 같은 규격에 점선 테두리만 두른다 */
function NewAlbumSlot({ dist, onPress }: { dist: number; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: CARD,
        height: CARD,
        zIndex: 0,
        opacity: dist === 0 ? 1 : Math.max(0.25, 0.5 - (dist - 1) * 0.12),
        transform: [{ scale: dist === 0 ? 1 : Math.max(0.76, 0.86 - (dist - 1) * 0.05) }],
      }}
    >
      <View
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 6,
          backgroundColor: color.surface1,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: color.hairline,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontFamily: typeface, fontSize: 34, fontWeight: '300', color: color.sub }}>+</Text>
      </View>
    </Pressable>
  );
}

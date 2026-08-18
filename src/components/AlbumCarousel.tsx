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
import { LinearGradient } from 'expo-linear-gradient';
import { color, typeface } from '@/theme/tokens';
import { formatDday, isReleased, weekdayKo } from '@/lib/date';
import { AlbumJacket } from '@/components/AlbumJacket';
import { Dday } from '@/components/Dday';
import { Photo } from '@/components/Photo';

export type CarouselAlbum = {
  id: string;
  title: string;
  date: string;
  coverThumbUrl: string | null;
  /** 저해상도 커버 — 본체(1080)가 오기 전에 깔아 둔다 */
  coverLowUrl?: string | null;
};

/** 카드 최대 폭 — 좁은 기기에선 화면 비율로 줄인다 */
const MAX_CARD = 250;
/** 캐러셀 좌우 여백 — 이웃 카드가 이 안쪽에 머문다 */
const GUTTER = 20;
/** 이웃이 가운데 뒤로 파고들 최소 폭 */
const MIN_OVERLAP = 34;

/**
 * 앨범 캐러셀 — 가운데가 현재, 왼쪽이 지난 데이트·오른쪽이 앞으로의 데이트.
 * 이웃은 뒤로 겹쳐 들어가며 작고 연하게 깔린다. 스크롤하면 STEP 단위로 스냅되고
 * 가운데 온 앨범이 활성으로 바뀐다. 사진 없는 앨범은 그라디언트 자켓으로 채운다.
 * 제목·날짜는 카드 아래가 아니라 자켓 바닥에 얹는다 (자켓 = 하나의 완결된 그림).
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
  const card = Math.min(MAX_CARD, Math.round(screen * 0.64));
  const side = Math.max(0, (screen - card) / 2);
  // 이웃 카드의 바깥 가장자리가 GUTTER 안쪽에 오도록 보폭을 잡는다 (화면 밖으로 나가지 않게)
  const step = Math.min(card - MIN_OVERLAP, Math.max(card * 0.5, side - GUTTER));
  const overlap = card - step;

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

  return (
    <View>
      {/* contentContainerStyle 세로 여백을 넉넉히 — 활성 카드 글로우가 스크롤뷰 경계에서 잘리지 않게 */}
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
        contentContainerStyle={{ paddingHorizontal: side, paddingVertical: 40 }}
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
                width: card,
                height: card,
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
                    <Photo
                      url={a.coverThumbUrl}
                      lowUrl={a.coverLowUrl}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  ) : (
                    <AlbumJacket seed={a.id} />
                  )}

                  {/* 제목이 바닥을 쓰므로 D-day는 위로. 커버 사진 위라 solid */}
                  {upcoming && (
                    <View style={{ position: 'absolute', left: 10, top: 10 }}>
                      <Dday tone="accent" solid>
                        {formatDday(a.date)}
                      </Dday>
                    </View>
                  )}

                  {/*
                    제목 판 — 반투명 면을 넓게 깔지 않는다. 아래로 갈수록 짙어지는 스크림만 두고
                    글자가 앉는 마지막 한 뼘에서만 불투명해진다.
                  */}
                  <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.82)']}
                    locations={[0, 0.45, 1]}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      paddingHorizontal: 14,
                      paddingTop: 32,
                      paddingBottom: 13,
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: typeface,
                        fontWeight: '800',
                        fontSize: 22,
                        letterSpacing: -0.5,
                        color: color.white,
                      }}
                    >
                      {a.title}
                    </Text>
                    <Text
                      style={{
                        marginTop: 3,
                        fontFamily: typeface,
                        fontWeight: '600',
                        fontSize: 14,
                        color: 'rgba(255,255,255,0.8)',
                      }}
                    >
                      {a.date.slice(5).replace('-', '.')} ({weekdayKo(a.date)})
                    </Text>
                  </LinearGradient>
                </View>
              </View>
            </Pressable>
          );
        })}

        {/* 꼬리의 빈 앨범 — "한 장 더 꽂는다". 활성 글로우는 주지 않는다(앨범이 아니므로) */}
        <NewAlbumSlot
          size={card}
          dist={Math.abs(albums.length - active)}
          total={total}
          onPress={onCreate}
        />
      </ScrollView>
    </View>
  );
}

/** 캐러셀 꼬리의 빈 앨범 — 실제 앨범과 같은 규격에 점선 테두리만 두른다 */
function NewAlbumSlot({
  size,
  dist,
  total,
  onPress,
}: {
  size: number;
  dist: number;
  total: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: size,
        height: size,
        // 앨범과 같은 규칙 — 가운데로 오면 맨 위. 고정 0이면 왼쪽 앨범이 위를 덮는다
        zIndex: total - dist,
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
          gap: 6,
        }}
      >
        <Text style={{ fontFamily: typeface, fontSize: 36, fontWeight: '300', color: color.sub }}>+</Text>
        <Text style={{ fontFamily: typeface, fontSize: 13, fontWeight: '600', color: color.sub }}>새 데이트</Text>
      </View>
    </Pressable>
  );
}

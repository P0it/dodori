import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { color, role, typeface } from '@/theme/tokens';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';
import { Eyebrow } from '@/components/Eyebrow';
import { monthCells, addMonths, monthLabel } from '@/lib/calendar';
import { monthKey as toMonthKey, todayKST, isISODate } from '@/lib/date';
import { useCreateTrack } from '@/api/tracks';
import { useAddTrackPlace, usePlaceSearch, type SearchPlace } from '@/api/places';
import { useMonthEvents } from '@/api/events';
import { toKSTDate } from '@/lib/date';

/** 데이트 만들기 위저드 — 1) 날짜 2) 장소 담기 (목업 22·23) */
export default function CreateTrack() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const [step, setStep] = useState<1 | 2>(params.date && isISODate(params.date) ? 2 : 1);
  const [date, setDate] = useState(params.date && isISODate(params.date) ? params.date : '');
  const [course, setCourse] = useState<SearchPlace[]>([]);

  const create = useCreateTrack();
  const [saving, setSaving] = useState(false);
  // addTrackPlace 훅은 trackId가 생긴 뒤 직접 호출하기 어렵다 — 저장 시 일괄 처리
  const finish = async () => {
    if (!date || saving) return;
    setSaving(true);
    try {
      const trackId = await create.mutateAsync({ date });
      // 코스 저장 (순서대로)
      const { upsertPlace } = await import('@/api/places');
      const { supabase } = await import('@/api/supabase');
      const { data: userData } = await supabase.auth.getUser();
      for (let i = 0; i < course.length; i++) {
        const placeId = await upsertPlace(course[i]);
        await supabase.from('track_places').insert({
          track_id: trackId,
          place_id: placeId,
          sort_order: i,
          added_by: userData.user!.id,
        });
      }
      router.dismiss();
      router.push(`/track/${trackId}`);
    } catch (e) {
      Alert.alert('저장 실패', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar
        title="데이트 만들기"
        right={<Text style={{ fontFamily: typeface, fontSize: 12.5, color: color.sub }}>{step}/2</Text>}
      />
      {step === 1 ? (
        <PickDate
          date={date}
          onPick={setDate}
          onNext={() => date && setStep(2)}
        />
      ) : (
        <PickPlaces
          course={course}
          setCourse={setCourse}
          onDone={finish}
          saving={saving}
        />
      )}
    </View>
  );
}

/* ---------- step 1: 날짜 선택 (목업 22) ---------- */
function PickDate({
  date,
  onPick,
  onNext,
}: {
  date: string;
  onPick: (d: string) => void;
  onNext: () => void;
}) {
  const [month, setMonth] = useState(() => (date ? date.slice(0, 7) : toMonthKey(todayKST())));
  const cells = useMemo(() => monthCells(month), [month]);
  const events = useMonthEvents(month);
  const lbl = monthLabel(month);

  const busyDays = useMemo(() => {
    const s = new Set<string>();
    for (const e of events.data ?? []) {
      if (e.starts_at) s.add(toKSTDate(new Date(e.starts_at)));
    }
    return s;
  }, [events.data]);

  const freeDay = date && !busyDays.has(date);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
        <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 23, color: color.white, letterSpacing: -0.4 }}>
          언제 만날까요?
        </Text>
        <Meta style={{ marginTop: 8 }}>둘 다 비어 있는 날을 골라보세요.</Meta>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          paddingTop: 18,
          paddingBottom: 6,
        }}
      >
        <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 17, color: color.white }}>
          {lbl.year}년 {lbl.month}
        </Text>
        <View style={{ flexDirection: 'row', gap: 20 }}>
          <Pressable hitSlop={8} onPress={() => setMonth((m) => addMonths(m, -1))}>
            <Text style={{ fontFamily: typeface, color: color.sub, fontSize: 17 }}>‹</Text>
          </Pressable>
          <Pressable hitSlop={8} onPress={() => setMonth((m) => addMonths(m, 1))}>
            <Text style={{ fontFamily: typeface, color: color.sub, fontSize: 17 }}>›</Text>
          </Pressable>
        </View>
      </View>

      {/* 미니 먼스 — 선택 전용 */}
      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row' }}>
          {['일', '월', '화', '수', '목', '금', '토'].map((w, i) => (
            <Text
              key={w}
              style={{
                flex: 1,
                textAlign: 'center',
                paddingVertical: 6,
                fontSize: 11,
                fontFamily: typeface, fontWeight: '600',
                color: i === 0 ? role.partner : color.muted,
              }}
            >
              {w}
            </Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cells.map((c) => {
            const selected = c.inMonth && c.date === date;
            return (
              <Pressable
                key={c.date}
                disabled={!c.inMonth}
                onPress={() => onPick(c.date)}
                style={{ width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 5 }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selected ? role.me : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14.5,
                      fontWeight: selected || c.isToday ? '700' : '500',
                      color: !c.inMonth
                        ? '#444'
                        : selected
                          ? color.bg
                          : c.isToday
                            ? role.me
                            : color.white,
                    }}
                  >
                    {c.day}
                  </Text>
                </View>
                {c.inMonth && busyDays.has(c.date) && (
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: color.muted,
                      marginTop: 1,
                    }}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {date ? (
        <View style={{ paddingHorizontal: 24, paddingTop: 14 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              padding: 14,
              borderRadius: 12,
              backgroundColor: 'rgba(30,215,96,0.10)',
              borderWidth: 1,
              borderColor: role.me,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: role.me,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 16, color: color.bg }}>
                {Number(date.slice(8, 10))}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 15, color: color.white }}>
                {Number(date.slice(5, 7))}월 {Number(date.slice(8, 10))}일
              </Text>
              <Meta style={{ marginTop: 2, fontSize: 12 }}>
                {freeDay ? '둘 다 일정 없음 · 데이트하기 좋은 날' : '이 날 일정이 있어요'}
              </Meta>
            </View>
          </View>
        </View>
      ) : null}

      <View style={{ paddingHorizontal: 24, paddingTop: 18 }}>
        <Pressable
          onPress={onNext}
          disabled={!date}
          style={({ pressed }) => ({
            height: 52,
            borderRadius: 999,
            backgroundColor: role.me,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: !date ? 0.4 : pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 15, color: color.onPrimary }}>
            다음 · 장소 담기
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

/* ---------- step 2: 장소 검색·코스 (목업 23, §7.4 단일 공용 검색) ---------- */
function PickPlaces({
  course,
  setCourse,
  onDone,
  saving,
}: {
  course: SearchPlace[];
  setCourse: (fn: (prev: SearchPlace[]) => SearchPlace[]) => void;
  onDone: () => void;
  saving: boolean;
}) {
  const [query, setQuery] = useState('');
  const search = usePlaceSearch(query);
  const inCourse = (p: SearchPlace) => course.some((c) => c.naver_id === p.naver_id);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="성수 카페, 맛집 검색"
          placeholderTextColor={color.muted}
          style={{
            height: 44,
            borderRadius: 6,
            backgroundColor: color.surface2,
            paddingHorizontal: 14,
            color: color.white,
            fontSize: 15,
          }}
        />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 220 }}>
        {query.trim().length < 2 ? (
          <Meta style={{ paddingVertical: 16 }}>
            검색해서 코스에 담아보세요. 담은 장소만 저장돼요.
          </Meta>
        ) : search.isPending ? (
          <ActivityIndicator color={role.me} style={{ marginTop: 24 }} />
        ) : search.isError ? (
          <Meta style={{ paddingVertical: 16 }}>{String(search.error.message)}</Meta>
        ) : (
          <>
            <Eyebrow style={{ marginVertical: 8 }}>검색 결과</Eyebrow>
            {(search.data ?? []).map((p) => {
              const added = inCourse(p);
              return (
                <View
                  key={p.naver_id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 11,
                  }}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.white }}>
                      {p.name}
                    </Text>
                    <Meta style={{ marginTop: 2, fontSize: 12 }}>
                      {[p.category, p.address].filter(Boolean).join(' · ')}
                    </Meta>
                  </View>
                  <Pressable
                    onPress={() =>
                      setCourse((prev) =>
                        added ? prev.filter((c) => c.naver_id !== p.naver_id) : [...prev, p],
                      )
                    }
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      borderWidth: added ? 0 : 1.5,
                      borderColor: color.sub,
                      backgroundColor: added ? role.me : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: added ? color.bg : color.white, fontFamily: typeface, fontWeight: '700' }}>
                      {added ? '✓' : '+'}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* 담은 코스 도킹 (목업 23) */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: 16,
          paddingBottom: 26,
          backgroundColor: '#0d0d0d',
        }}
      >
        <View style={{ borderRadius: 14, backgroundColor: color.surface2, padding: 12 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 13.5, color: color.white }}>
              담은 코스 · {course.length}
            </Text>
            {course.length > 0 && (
              <Pressable onPress={() => setCourse(() => [])}>
                <Meta style={{ fontSize: 11.5 }}>비우기</Meta>
              </Pressable>
            )}
          </View>
          {course.length === 0 ? (
            <Meta style={{ fontSize: 12 }}>장소 없이도 만들 수 있어요</Meta>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {course.slice(0, 4).map((c, i) => (
                <View
                  key={c.naver_id}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    paddingVertical: 8,
                    paddingHorizontal: 4,
                    borderRadius: 8,
                    backgroundColor: color.surface1,
                  }}
                >
                  <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 11, color: role.me }}>{i + 1}</Text>
                  <Text
                    numberOfLines={1}
                    style={{ fontSize: 11, color: color.white, marginTop: 3 }}
                  >
                    {c.name}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <Pressable
          onPress={onDone}
          disabled={saving}
          style={({ pressed }) => ({
            marginTop: 12,
            height: 52,
            borderRadius: 999,
            backgroundColor: role.me,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed || saving ? 0.85 : 1,
          })}
        >
          {saving ? (
            <ActivityIndicator color={color.onPrimary} />
          ) : (
            <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 15, color: color.onPrimary }}>
              완료 · 데이트 만들기
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

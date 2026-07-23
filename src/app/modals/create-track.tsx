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
import { monthCells, addMonths, monthLabel } from '@/lib/calendar';
import { monthKey as toMonthKey, todayKST, isISODate } from '@/lib/date';
import { useCreateTrack } from '@/api/tracks';
import { useMonthEvents } from '@/api/events';
import { toKSTDate } from '@/lib/date';

/** 데이트 만들기 — 1) 날짜 2) 제목. 장소는 앨범을 만든 뒤 상세에서 담는다. */
export default function CreateTrack() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const seeded = params.date && isISODate(params.date) ? params.date : '';
  const [step, setStep] = useState<1 | 2>(seeded ? 2 : 1);
  const [date, setDate] = useState(seeded);
  const [title, setTitle] = useState('');

  const create = useCreateTrack();
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    if (!date || saving) return;
    setSaving(true);
    try {
      const trackId = await create.mutateAsync({ date, title });
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
        <PickDate date={date} onPick={setDate} onNext={() => date && setStep(2)} />
      ) : (
        <PickTitle date={date} title={title} setTitle={setTitle} onDone={finish} saving={saving} />
      )}
    </View>
  );
}

/* ---------- step 2: 제목 ---------- */
function PickTitle({
  date,
  title,
  setTitle,
  onDone,
  saving,
}: {
  date: string;
  title: string;
  setTitle: (s: string) => void;
  onDone: () => void;
  saving: boolean;
}) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
        <Text
          style={{ fontFamily: typeface, fontWeight: '800', fontSize: 23, color: color.white, letterSpacing: -0.4 }}
        >
          어떤 데이트인가요?
        </Text>
        <Meta style={{ marginTop: 8 }}>
          {date.replaceAll('-', '.')} · 장소는 만든 뒤에 담을 수 있어요.
        </Meta>
        <TextInput
          value={title}
          onChangeText={setTitle}
          autoFocus
          placeholder="예: 성수 카페 투어"
          placeholderTextColor={color.muted}
          style={{
            marginTop: 20,
            height: 48,
            borderRadius: 6,
            backgroundColor: color.surface2,
            paddingHorizontal: 14,
            color: color.white,
            fontFamily: typeface,
            fontSize: 16,
          }}
        />
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ padding: 16, paddingBottom: 26 }}>
        <Pressable
          disabled={saving}
          onPress={onDone}
          style={({ pressed }) => ({
            height: 48,
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
            <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 14.5, color: color.onPrimary }}>
              만들기
            </Text>
          )}
        </Pressable>
      </View>
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

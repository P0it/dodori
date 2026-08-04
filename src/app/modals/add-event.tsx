import { useEffect, useMemo, useState } from 'react';
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
import Svg, { Path } from 'react-native-svg';
import {
  color,
  DEFAULT_EVENT_COLOR,
  eventColor,
  EVENT_COLOR_KEYS,
  toEventColor,
  typeface,
  type EventColorKey,
} from '@/theme/tokens';
import { isISODate, todayKST, toKSTDate, weekdayKo } from '@/lib/date';
import { addHours, isAfter, isHHmm } from '@/lib/time';
import {
  useCreateEvent,
  useDeleteEvent,
  useMonthEvents,
  useUpdateEvent,
} from '@/api/events';
import { Meta } from '@/components/Meta';
import { DatePicker, initialMonth } from '@/components/DatePicker';
import { TimePicker } from '@/components/TimePicker';
import { useCoupleProfiles } from '@/api/couple';

/** 일정 추가/수정 (목업 21) — 주인(나/상대)·제목·날짜·시간·종일·설명 */
export default function AddEvent() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string; id?: string }>();
  const editingId = params.id ?? null;

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(params.date ?? todayKST());
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [description, setDescription] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [eventColorKey, setEventColorKey] = useState<EventColorKey>(DEFAULT_EVENT_COLOR);
  /** 어떤 피커가 펼쳐져 있나 — 한 번에 하나만 */
  const [open, setOpen] = useState<'none' | 'date' | 'start' | 'end'>('none');
  const [pickerMonth, setPickerMonth] = useState(() => initialMonth(params.date ?? todayKST()));

  // 수정 모드: 기존 값 로드 (해당 월 캐시에서)
  const monthEvents = useMonthEvents(date.slice(0, 7));
  useEffect(() => {
    if (!editingId) return;
    const e = monthEvents.data?.find((ev) => ev.id === editingId);
    if (!e || !e.starts_at) return;
    setTitle(e.title ?? '');
    const d = toKSTDate(new Date(e.starts_at));
    setDate(d);
    setPickerMonth(initialMonth(d));
    setAllDay(!!e.all_day);
    setDescription(e.description ?? '');
    setStartTime(kstTime(e.starts_at));
    setEndTime(e.ends_at ? kstTime(e.ends_at) : '');
    setOwnerId(e.owner_id ?? '');
    setEventColorKey(toEventColor(e.color));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId, monthEvents.data]);

  const create = useCreateEvent();
  const update = useUpdateEvent();
  const remove = useDeleteEvent();
  const profiles = useCoupleProfiles();
  const busy = create.isPending || update.isPending || remove.isPending;

  // 새 일정 기본 주인은 나
  useEffect(() => {
    if (editingId || ownerId) return;
    const meId = profiles.data?.me?.id;
    if (meId) setOwnerId(meId);
  }, [editingId, ownerId, profiles.data]);

  // 종료는 선택이지만, 넣었다면 시작보다 뒤여야 한다 — 일정은 날짜를 넘기지 않는다
  const endOk = !endTime || isAfter(startTime, endTime);
  const valid =
    title.trim().length > 0 && isISODate(date) && !!ownerId && (allDay || (isHHmm(startTime) && endOk));

  const save = () => {
    if (!valid || busy) return;
    const input = {
      title: title.trim(),
      ownerId,
      startsAt: allDay ? `${date}T00:00:00+09:00` : `${date}T${startTime}:00+09:00`,
      endsAt: !allDay && isHHmm(endTime) ? `${date}T${endTime}:00+09:00` : null,
      allDay,
      description: description.trim() || null,
      color: eventColorKey,
    };
    const done = { onSuccess: () => router.back(), onError: showError };
    if (editingId) update.mutate({ id: editingId, ...input }, done);
    else create.mutate(input, done);
  };

  const del = () => {
    if (!editingId) return;
    Alert.alert('일정 삭제', '이 일정을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => remove.mutate(editingId, { onSuccess: () => router.back(), onError: showError }),
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      {/* 상단 액션 바 */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 5l-7 7 7 7"
              stroke={color.white}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
        <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 16, color: color.white }}>
          {editingId ? '일정 수정' : '일정 추가'}
        </Text>
        <Pressable onPress={save} hitSlop={8} disabled={!valid || busy}>
          {busy ? (
            <ActivityIndicator size="small" color={color.accent} />
          ) : (
            <Text
              style={{
                fontFamily: typeface, fontWeight: '700',
                fontSize: 15,
                color: valid ? color.accent : color.muted,
              }}
            >
              저장
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        {/* 누구 일정인가 — 나/상대 중 선택 (owner_id) */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
          {(['me', 'partner'] as const).map((who) => {
            const p = who === 'me' ? profiles.data?.me : profiles.data?.partner;
            const on = !!p && ownerId === p.id;
            return (
              <Pressable
                key={who}
                disabled={!p}
                onPress={() => p && setOwnerId(p.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 7,
                  paddingHorizontal: 14,
                  height: 36,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: on ? color.white : color.surface3,
                  backgroundColor: on ? 'rgba(255,255,255,0.10)' : 'transparent',
                  opacity: p ? 1 : 0.4,
                }}
              >
                <Text
                  style={{
                    fontFamily: typeface,
                    fontWeight: '700',
                    fontSize: 13,
                    color: on ? color.white : color.sub,
                  }}
                >
                  {p?.nickname || (who === 'me' ? '나' : '상대')}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 일정 색 — 사람이 아니라 이 일정의 색. 9색이라 한 줄에 안 들어가면 접힌다 */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 18,
          }}
        >
          {EVENT_COLOR_KEYS.map((key) => {
            const on = eventColorKey === key;
            return (
              <Pressable
                key={key}
                onPress={() => setEventColorKey(key)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={`일정 색 ${key}`}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: on ? 2 : 0,
                  borderColor: color.white,
                }}
              >
                <View
                  style={{
                    width: on ? 16 : 22,
                    height: on ? 16 : 22,
                    borderRadius: 11,
                    backgroundColor: eventColor[key].fg,
                  }}
                />
              </Pressable>
            );
          })}
        </View>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="제목"
          placeholderTextColor={color.muted}
          autoFocus={!editingId}
          style={{
            paddingVertical: 12,
            borderBottomWidth: 1.5,
            borderBottomColor: color.surface3,
            fontFamily: typeface, fontWeight: '800',
            fontSize: 28,
            letterSpacing: -0.5,
            color: color.white,
          }}
        />

        <View style={{ marginTop: 20, gap: 10 }}>
          <FieldRow
            label="날짜"
            onPress={() => setOpen((v) => (v === 'date' ? 'none' : 'date'))}
            value={`${date.replaceAll('-', '.')} (${weekdayKo(date)})`}
            open={open === 'date'}
          />
          {open === 'date' && (
            <DatePicker
              value={date}
              // 날짜는 한 번 고르면 끝 — 계속 펼쳐두면 아래 항목이 가린다
              onChange={(d) => {
                setDate(d);
                setOpen('none');
              }}
              month={pickerMonth}
              onMonthChange={setPickerMonth}
            />
          )}

          {!allDay && (
            <>
              <FieldRow
                label="시작"
                onPress={() => setOpen((v) => (v === 'start' ? 'none' : 'start'))}
                value={startTime}
                open={open === 'start'}
              />
              {open === 'start' && (
                <TimePicker
                  value={startTime}
                  onChange={(t) => {
                    setStartTime(t);
                    // 종료가 비어 있으면 +2시간을 깔아준다 — 대부분의 데이트가 그쯤이고, 바로 고쳐 쓸 수 있다
                    if (!endTime) setEndTime(addHours(t, 2));
                  }}
                />
              )}

              <FieldRow
                label="종료"
                onPress={() => {
                  // 비어 있는 채로 열면 휠에 보이는 값(시작+2시간)을 바로 값으로 삼는다 —
                  // 굴리지 않고 닫으면 '없음'으로 남는 게 함정이었다. 없애려면 아래 버튼으로.
                  if (open !== 'end' && !endTime) setEndTime(addHours(startTime, 2));
                  setOpen((v) => (v === 'end' ? 'none' : 'end'));
                }}
                value={endTime || '없음'}
                muted={!endTime}
                warn={!endOk}
                open={open === 'end'}
              />
              {open === 'end' && (
                <View style={{ gap: 8 }}>
                  <TimePicker value={endTime || addHours(startTime, 2)} onChange={setEndTime} />
                  {!!endTime && (
                    <Pressable onPress={() => setEndTime('')} style={{ alignSelf: 'center' }} hitSlop={8}>
                      <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 13, color: color.sub }}>
                        종료 시각 없애기
                      </Text>
                    </Pressable>
                  )}
                  {!endOk && (
                    <Meta style={{ fontSize: 12, textAlign: 'center', color: color.danger }}>
                      종료는 시작보다 뒤여야 해요
                    </Meta>
                  )}
                </View>
              )}
            </>
          )}

          <FieldRow label="종일">
            <Toggle on={allDay} onToggle={() => setAllDay((v) => !v)} />
          </FieldRow>
        </View>

        {/* 설명 (메모) — 상대에게 그대로 공유됨 */}
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="설명 (선택)"
          placeholderTextColor={color.muted}
          multiline
          style={{
            marginTop: 10,
            minHeight: 92,
            padding: 16,
            borderRadius: 12,
            backgroundColor: color.surface1,
            fontFamily: typeface,
            fontWeight: '500',
            fontSize: 15,
            lineHeight: 22,
            color: color.white,
            textAlignVertical: 'top',
          }}
        />

        <Meta style={{ fontSize: 11.5, textAlign: 'center', marginTop: 18 }}>
          상대 캘린더에 바로 반영돼요
        </Meta>

        {editingId && (
          <Pressable onPress={del} style={{ marginTop: 24, alignItems: 'center' }}>
            <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 14, color: '#E8567A' }}>일정 삭제</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

function showError(e: unknown) {
  Alert.alert('저장 실패', e instanceof Error ? e.message : String(e));
}

function kstTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  });
}
/**
 * 설정 행. `value`를 주면 눌러서 아래 피커를 여는 행이 되고,
 * `children`을 주면 그 자리에 컨트롤(종일 토글)을 그대로 놓는다.
 */
function FieldRow({
  label,
  children,
  value,
  onPress,
  open,
  muted,
  warn,
}: {
  label: string;
  children?: React.ReactNode;
  value?: string;
  onPress?: () => void;
  open?: boolean;
  muted?: boolean;
  warn?: boolean;
}) {
  const body = (
    <>
      <Text style={{ flex: 1, fontFamily: typeface, fontWeight: '500', fontSize: 14, color: color.sub }}>{label}</Text>
      {value !== undefined ? (
        <Text
          style={{
            fontFamily: typeface,
            fontWeight: '700',
            fontSize: 15,
            color: warn ? color.danger : muted ? color.muted : color.white,
          }}
        >
          {value}
        </Text>
      ) : (
        children
      )}
    </>
  );

  const style = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: color.surface1,
    borderWidth: 1,
    borderColor: open ? color.accent : 'transparent',
  } as const;

  if (!onPress) return <View style={style}>{body}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [style, { opacity: pressed ? 0.85 : 1 }]}>
      {body}
    </Pressable>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <Pressable
      onPress={onToggle}
      style={{
        width: 46,
        height: 28,
        borderRadius: 999,
        backgroundColor: on ? color.accent : color.surface3,
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          position: 'absolute',
          left: on ? 21 : 3,
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: color.white,
        }}
      />
    </Pressable>
  );
}

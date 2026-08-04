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
import { isISODate, todayKST, weekdayKo } from '@/lib/date';
import { addHours, isAfter, isHHmm } from '@/lib/time';
import { daySpan, eventDayRange } from '@/lib/span';
import {
  useCreateEvent,
  useDeleteEvent,
  useMonthEvents,
  useUpdateEvent,
} from '@/api/events';
import { Meta } from '@/components/Meta';
import { DatePicker, initialMonth } from '@/components/DatePicker';
import { TimePicker } from '@/components/TimePicker';
import { ChevronGlyph, ClockGlyph } from '@/components/glyphs';
import { useCoupleProfiles } from '@/api/couple';

/** 일정 추가/수정 (목업 21) — 주인(나/상대)·제목·날짜·시간·종일·설명 */
export default function AddEvent() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string; id?: string }>();
  const editingId = params.id ?? null;

  const seed = params.date ?? todayKST();

  const [title, setTitle] = useState('');
  // 기본은 오늘 하루 종일 — 대부분의 일정이 그렇고, 여러 날이면 종료일만 바꾸면 된다
  const [startDate, setStartDate] = useState(seed);
  const [endDate, setEndDate] = useState(seed);
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('21:00');
  const [allDay, setAllDay] = useState(true);
  const [description, setDescription] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [eventColorKey, setEventColorKey] = useState<EventColorKey>(DEFAULT_EVENT_COLOR);
  /** 어떤 피커가 펼쳐져 있나 — 한 번에 하나만 */
  const [open, setOpen] = useState<'none' | 'startDate' | 'endDate' | 'startTime' | 'endTime'>('none');
  const [pickerMonth, setPickerMonth] = useState(() => initialMonth(seed));

  // 수정 모드: 기존 값 로드 (해당 월 캐시에서)
  const monthEvents = useMonthEvents(startDate.slice(0, 7));
  useEffect(() => {
    if (!editingId) return;
    const e = monthEvents.data?.find((ev) => ev.id === editingId);
    if (!e || !e.starts_at) return;
    setTitle(e.title ?? '');
    const { from, to } = eventDayRange(e.starts_at, e.ends_at);
    setStartDate(from);
    setEndDate(to);
    setPickerMonth(initialMonth(from));
    setAllDay(!!e.all_day);
    setDescription(e.description ?? '');
    setStartTime(kstTime(e.starts_at));
    // 종일이 아닌데 종료가 없던 옛 일정은 시작+2시간으로 채운다 (이제 종료는 항상 있다)
    setEndTime(e.ends_at && !e.all_day ? kstTime(e.ends_at) : addHours(kstTime(e.starts_at), 2));
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

  const multiDay = daySpan(startDate, endDate) > 1;
  // 종료일은 시작일보다 앞설 수 없고, 하루짜리 시간 일정이면 종료 시각이 시작보다 뒤여야 한다.
  // 여러 날이면 시각의 앞뒤는 따지지 않는다 (10일 19시 → 13일 09시는 정상)
  const rangeOk = daySpan(startDate, endDate) >= 1;
  const timeOk = allDay || multiDay || isAfter(startTime, endTime);
  const valid =
    title.trim().length > 0 &&
    isISODate(startDate) &&
    isISODate(endDate) &&
    !!ownerId &&
    rangeOk &&
    (allDay || (isHHmm(startTime) && isHHmm(endTime))) &&
    timeOk;

  const save = () => {
    if (!valid || busy) return;
    const input = {
      title: title.trim(),
      ownerId,
      // 종일은 그 날 전체를 덮는다 — 마지막 날 23:59:59까지 잡아야 캘린더 막대가 그 날을 포함한다
      startsAt: allDay ? `${startDate}T00:00:00+09:00` : `${startDate}T${startTime}:00+09:00`,
      endsAt: allDay ? `${endDate}T23:59:59+09:00` : `${endDate}T${endTime}:00+09:00`,
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
          {/*
            때 — 종일 스위치와 시작·종료가 한 카드. 시계가 이 덩어리를 '언제'로 묶으므로
            '시작'·'종료' 라벨은 두지 않는다 (사이의 꺾쇠가 방향을 대신한다).
            날짜 줄과 시각 줄이 각각 제 몫의 탭 대상이라 고치고 싶은 것만 바로 누른다.
          */}
          <View style={{ paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: color.surface1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ClockGlyph size={18} />
              <Text style={{ flex: 1, fontFamily: typeface, fontWeight: '500', fontSize: 14, color: color.sub }}>
                종일
              </Text>
              <Toggle on={allDay} onToggle={() => setAllDay((v) => !v)} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingLeft: 28 }}>
              <WhenBlock
                date={dateLabel(startDate)}
                time={allDay ? null : startTime}
                openDate={open === 'startDate'}
                openTime={open === 'startTime'}
                onPressDate={() => setOpen((v) => (v === 'startDate' ? 'none' : 'startDate'))}
                onPressTime={() => setOpen((v) => (v === 'startTime' ? 'none' : 'startTime'))}
              />
              <ChevronGlyph size={20} />
              <WhenBlock
                date={dateLabel(endDate)}
                time={allDay ? null : endTime}
                warn={!timeOk}
                openDate={open === 'endDate'}
                openTime={open === 'endTime'}
                onPressDate={() => setOpen((v) => (v === 'endDate' ? 'none' : 'endDate'))}
                onPressTime={() => setOpen((v) => (v === 'endTime' ? 'none' : 'endTime'))}
              />
            </View>
          </View>

          {multiDay && (
            <Meta style={{ marginTop: -4, fontSize: 12, textAlign: 'center' }}>
              {daySpan(startDate, endDate)}일간
            </Meta>
          )}

          {open === 'startDate' && (
            <DatePicker
              value={startDate}
              // 날짜는 한 번 고르면 끝 — 계속 펼쳐두면 아래 항목이 가린다
              onChange={(d) => {
                setStartDate(d);
                // 시작을 종료 뒤로 밀면 종료도 함께 당겨온다 — 뒤집힌 채로 두면 저장을 막을 뿐이다
                if (d > endDate) setEndDate(d);
                setOpen('none');
              }}
              month={pickerMonth}
              onMonthChange={setPickerMonth}
            />
          )}
          {open === 'endDate' && (
            <DatePicker
              value={endDate}
              onChange={(d) => {
                setEndDate(d);
                if (d < startDate) setStartDate(d);
                setOpen('none');
              }}
              month={pickerMonth}
              onMonthChange={setPickerMonth}
            />
          )}
          {open === 'startTime' && (
            <TimePicker
              value={startTime}
              onChange={(t) => {
                setStartTime(t);
                // 하루짜리면 종료를 앞질러 갈 수 없다 — 따라 밀어준다
                if (!multiDay && !isAfter(t, endTime)) setEndTime(addHours(t, 2));
              }}
            />
          )}
          {open === 'endTime' && (
            <View style={{ gap: 8 }}>
              <TimePicker value={endTime} onChange={setEndTime} />
              {!timeOk && (
                <Meta style={{ fontSize: 12, textAlign: 'center', color: color.danger }}>
                  종료는 시작보다 뒤여야 해요
                </Meta>
              )}
            </View>
          )}
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

/**
 * '2026-08-05' → '26.8.5(월)'. 한 줄에 날짜·시각이 넷 서므로 앞의 0과 빈칸을 다 턴다.
 * 연도는 두 자리로 늘 붙인다 — 빼는 조건을 두는 것보다 짧고, 다른 해도 한눈에 걸린다.
 */
function dateLabel(d: string): string {
  const [y, m, day] = d.split('-');
  return `${y.slice(2)}.${Number(m)}.${Number(day)}(${weekdayKo(d)})`;
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
 * 때 카드의 한 쪽 — 시작 또는 종료. 날짜가 윗줄, 시각이 아랫줄이고 각각 따로 눌린다.
 * 종일이면 시각 줄이 없어 날짜가 그 자리를 이어받아 커진다.
 * 지금 고치는 중인 줄은 브랜드 색으로 짚는다 (밑줄·테두리 없이 색만 — 줄이 둘이라 장식이 겹친다).
 */
function WhenBlock({
  date,
  time,
  warn,
  openDate,
  openTime,
  onPressDate,
  onPressTime,
}: {
  date: string;
  /** null이면 종일 — 시각 줄을 그리지 않는다 */
  time: string | null;
  warn?: boolean;
  openDate: boolean;
  openTime: boolean;
  onPressDate: () => void;
  onPressTime: () => void;
}) {
  return (
    <View style={{ flex: 1, gap: 1 }}>
      <Pressable onPress={onPressDate} hitSlop={4} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: typeface,
            fontWeight: time === null ? '800' : '600',
            fontSize: time === null ? 19 : 13,
            color: openDate ? color.accent : time === null ? color.white : color.sub,
          }}
        >
          {date}
        </Text>
      </Pressable>
      {time !== null && (
        <Pressable onPress={onPressTime} hitSlop={4} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: typeface,
              fontWeight: '800',
              fontSize: 21,
              letterSpacing: -0.3,
              color: warn ? color.danger : openTime ? color.accent : color.white,
            }}
          >
            {time}
          </Text>
        </Pressable>
      )}
    </View>
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

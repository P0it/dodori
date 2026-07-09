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
import { color, role } from '@/theme/tokens';
import { isISODate, todayKST, toKSTDate } from '@/lib/date';
import {
  useCreateEvent,
  useDeleteEvent,
  useMonthEvents,
  useUpdateEvent,
} from '@/api/events';
import { OwnerDot } from '@/components/OwnerDot';
import { Meta } from '@/components/Meta';
import { useCoupleProfiles } from '@/api/couple';

/** 내 일정 추가/수정 (목업 21) — 제목·날짜·시간·종일·제목 숨김 */
export default function AddEvent() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string; id?: string }>();
  const editingId = params.id ?? null;

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(params.date ?? todayKST());
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [titleHidden, setTitleHidden] = useState(false);

  // 수정 모드: 기존 값 로드 (해당 월 캐시에서)
  const monthEvents = useMonthEvents(date.slice(0, 7));
  useEffect(() => {
    if (!editingId) return;
    const e = monthEvents.data?.find((ev) => ev.id === editingId);
    if (!e || !e.starts_at) return;
    setTitle(e.title ?? '');
    setDate(toKSTDate(new Date(e.starts_at)));
    setAllDay(!!e.all_day);
    setTitleHidden(!!e.title_hidden);
    setStartTime(kstTime(e.starts_at));
    setEndTime(e.ends_at ? kstTime(e.ends_at) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId, monthEvents.data]);

  const create = useCreateEvent();
  const update = useUpdateEvent();
  const remove = useDeleteEvent();
  const profiles = useCoupleProfiles();
  const busy = create.isPending || update.isPending || remove.isPending;

  const valid = title.trim().length > 0 && isISODate(date) && (allDay || isTime(startTime));

  const save = () => {
    if (!valid || busy) return;
    const input = {
      title: title.trim(),
      startsAt: allDay ? `${date}T00:00:00+09:00` : `${date}T${startTime}:00+09:00`,
      endsAt: !allDay && isTime(endTime) ? `${date}T${endTime}:00+09:00` : null,
      allDay,
      titleHidden,
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
          <Text style={{ fontWeight: '600', fontSize: 15, color: color.sub }}>취소</Text>
        </Pressable>
        <Text style={{ fontWeight: '700', fontSize: 16, color: color.white }}>
          {editingId ? '일정 수정' : '내 일정'}
        </Text>
        <Pressable onPress={save} hitSlop={8} disabled={!valid || busy}>
          {busy ? (
            <ActivityIndicator size="small" color={role.me} />
          ) : (
            <Text
              style={{
                fontWeight: '700',
                fontSize: 15,
                color: valid ? role.me : color.muted,
              }}
            >
              저장
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <OwnerDot who="me" size={12} />
          <Text style={{ fontWeight: '600', fontSize: 13, color: role.me }}>
            {profiles.data?.me?.nickname || '나'}의 일정
          </Text>
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
            fontWeight: '800',
            fontSize: 28,
            letterSpacing: -0.5,
            color: color.white,
          }}
        />

        <View style={{ marginTop: 20, gap: 10 }}>
          <FieldRow label="날짜">
            <SmallInput value={date} onChange={setDate} placeholder="2026-07-09" width={130} date />
          </FieldRow>
          {!allDay && (
            <FieldRow label="시간">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <SmallInput value={startTime} onChange={setStartTime} placeholder="19:00" time />
                <Text style={{ color: color.muted }}>–</Text>
                <SmallInput value={endTime} onChange={setEndTime} placeholder="(선택)" time />
              </View>
            </FieldRow>
          )}
          <FieldRow label="종일">
            <Toggle on={allDay} onToggle={() => setAllDay((v) => !v)} />
          </FieldRow>
        </View>

        {/* 제목 숨김 (§5 title_hidden) */}
        <View
          style={{ marginTop: 8, padding: 16, borderRadius: 12, backgroundColor: color.surface1 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', fontSize: 15, color: color.white }}>
                제목 숨김
              </Text>
              <Meta style={{ marginTop: 5, fontSize: 12, lineHeight: 18 }}>
                상대에게 제목 없이 "바쁨"으로만 보여요
              </Meta>
            </View>
            <Toggle on={titleHidden} onToggle={() => setTitleHidden((v) => !v)} />
          </View>
        </View>

        <Meta style={{ fontSize: 11.5, textAlign: 'center', marginTop: 18 }}>
          상대 캘린더에 바로 반영돼요
        </Meta>

        {editingId && (
          <Pressable onPress={del} style={{ marginTop: 24, alignItems: 'center' }}>
            <Text style={{ fontWeight: '600', fontSize: 14, color: '#E8567A' }}>일정 삭제</Text>
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
const isTime = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: color.surface1,
      }}
    >
      <Text style={{ flex: 1, fontWeight: '500', fontSize: 14, color: color.sub }}>{label}</Text>
      {children}
    </View>
  );
}

function SmallInput({
  value,
  onChange,
  placeholder,
  width = 76,
  time,
  date,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  width?: number;
  time?: boolean;
  date?: boolean;
}) {
  const handle = (t: string) => {
    const digits = t.replace(/\D/g, '');
    if (time) {
      const dd = digits.slice(0, 4);
      onChange(dd.length > 2 ? `${dd.slice(0, 2)}:${dd.slice(2)}` : dd);
    } else if (date) {
      const dd = digits.slice(0, 8);
      if (dd.length > 6) onChange(`${dd.slice(0, 4)}-${dd.slice(4, 6)}-${dd.slice(6)}`);
      else if (dd.length > 4) onChange(`${dd.slice(0, 4)}-${dd.slice(4)}`);
      else onChange(dd);
    } else onChange(t);
  };
  return (
    <TextInput
      value={value}
      onChangeText={handle}
      placeholder={placeholder}
      placeholderTextColor={color.muted}
      keyboardType="number-pad"
      style={{
        width,
        textAlign: 'center',
        fontWeight: '700',
        fontSize: 15,
        color: color.white,
        paddingVertical: 4,
      }}
    />
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
        backgroundColor: on ? role.me : color.surface3,
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

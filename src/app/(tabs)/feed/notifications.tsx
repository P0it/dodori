import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { color, typeface } from '@/theme/tokens';
import { formatRelative } from '@/lib/date';
import {
  notificationHref,
  notificationIcon,
  notificationText,
  type NotificationLike,
} from '@/lib/notifications';
import { useCoupleProfiles } from '@/api/couple';
import {
  useAppBadgeSync,
  useMarkRead,
  useNotifications,
  useUnreadCount,
  type AppNotification,
} from '@/api/notifications';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';
import { CommentGlyph, StackGlyph, StoryGlyph } from '@/components/glyphs';

/** 알림 목록 — 상대가 스토리·게시물·댓글을 남기면 여기 쌓인다 */
export default function Notifications() {
  const router = useRouter();
  const list = useNotifications();
  const unread = useUnreadCount();
  const markRead = useMarkRead();
  const profiles = useCoupleProfiles();

  // 읽고 나면 앱 아이콘 배지도 같이 내려간다
  useAppBadgeSync(unread.data);

  const nameOf = (actorId: string) => {
    const p = profiles.data;
    if (p?.partner?.id === actorId) return p.partner.nickname;
    if (p?.me?.id === actorId) return p.me.nickname;
    return null;
  };

  const open = (n: AppNotification) => {
    if (!n.readAt) markRead.mutate(n.id);
    router.push(notificationHref(n) as never);
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar title="알림" />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={list.isRefetching}
            onRefresh={list.refetch}
            tintColor={color.sub}
            colors={[color.accent]}
          />
        }
      >
        {list.data?.length === 0 && !list.isPending && (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text
              style={{ fontFamily: typeface, fontWeight: '700', fontSize: 16, color: color.white }}
            >
              아직 알림이 없어요
            </Text>
            <Meta style={{ marginTop: 7, textAlign: 'center' }}>
              상대가 스토리나 게시물을 올리면 여기로 알려드려요.
            </Meta>
          </View>
        )}

        {(list.data ?? []).map((n) => (
          <Row key={n.id} n={n} actorName={nameOf(n.actorId)} onPress={() => open(n)} />
        ))}
      </ScrollView>
    </View>
  );
}

function Row({
  n,
  actorName,
  onPress,
}: {
  n: AppNotification;
  actorName: string | null;
  onPress: () => void;
}) {
  const like: NotificationLike = {
    kind: n.kind,
    targetKind: n.targetKind,
    targetId: n.targetId,
    preview: n.preview,
  };
  const { title, body } = notificationText(like, actorName);
  const icon = notificationIcon(like);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: color.surface2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon === 'comment' ? (
          <CommentGlyph size={19} color={color.sub} />
        ) : icon === 'image' ? (
          <StoryGlyph size={19} color={color.sub} />
        ) : (
          <StackGlyph size={17} color={color.sub} />
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={2}
          style={{ fontFamily: typeface, fontWeight: '600', fontSize: 14, color: color.white }}
        >
          <Text style={{ fontWeight: '700' }}>{title}</Text>
          <Text style={{ color: color.sub }}>{`  ${body}`}</Text>
        </Text>
        <Meta style={{ marginTop: 3, fontSize: 12 }}>{formatRelative(n.createdAt)}</Meta>
      </View>

      {/* 안 읽은 것만 점 — 읽으면 조용히 사라진다 */}
      {!n.readAt && (
        <View
          style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color.accent }}
        />
      )}
    </Pressable>
  );
}

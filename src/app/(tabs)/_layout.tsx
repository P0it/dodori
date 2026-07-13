import { Tabs } from 'expo-router';
import { color } from '@/theme/tokens';
import { CoupleTabBar } from '@/components/CoupleTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CoupleTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: color.bg },
      }}
    >
      <Tabs.Screen name="today" options={{ title: '오늘' }} />
      <Tabs.Screen name="calendar" options={{ title: '캘린더' }} />
      <Tabs.Screen name="playlist" options={{ title: '플레이리스트' }} />
      <Tabs.Screen name="studio" options={{ title: '우리' }} />
    </Tabs>
  );
}

import { View, type ViewStyle, type StyleProp } from 'react-native';
import { role, type OwnerRole } from '@/theme/tokens';

type Props = {
  who: OwnerRole;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/** 3역할 점 — 나(green) / 상대(pink) / 기념일(amber). PRD §6.2 역할 규약 */
export function OwnerDot({ who, size = 9, style }: Props) {
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: role[who] },
        style,
      ]}
    />
  );
}

import { View, type ViewStyle, type StyleProp } from 'react-native';

type Props = { style?: StyleProp<ViewStyle> };

export function Divider({ style }: Props) {
  return <View style={[{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }, style]} />;
}

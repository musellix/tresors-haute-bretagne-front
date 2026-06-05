import { View, ActivityIndicator } from 'react-native';
import { colors } from '../src/theme';

export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={colors.textWhite} size="large" />
    </View>
  );
}

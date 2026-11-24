import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { colors, spacing } from '@/theme/tokens';

export function Placeholder({ title, message }: { title: string; message: string }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.box}>
        <Text variant="display">{title}</Text>
        <Text color="muted">{message}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  box: { padding: spacing.md, gap: spacing.sm },
});

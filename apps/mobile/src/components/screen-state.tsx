import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { userMessage } from '@/api/errors';
import { Text } from '@/components/text';
import { colors, radius, spacing, tapTarget } from '@/theme/tokens';

export function LoadingState() {
  return (
    <View style={styles.center} accessibilityLabel="Chargement">
      <ActivityIndicator color={colors.gold2} size="large" />
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <View style={styles.center} accessibilityRole="alert">
      <Text variant="bodyStrong" style={styles.centerText}>{userMessage(error)}</Text>
      {onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry} style={styles.button}>
          <Text variant="bodyStrong" color="white">Réessayer</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.center}>
      <Text color="muted" style={styles.centerText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  centerText: { textAlign: 'center' },
  button: {
    minHeight: tapTarget,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
  },
});

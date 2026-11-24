import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from '@/components/text';
import { colors, radius, spacing, tapTarget } from '@/theme/tokens';

type Props = TextInputProps & { label: string; error?: string };

export function TextField({ label, error, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <Text variant="small" style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        accessibilityLabel={label}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...rest}
      />
      {error ? <Text variant="caption" color="error" accessibilityRole="alert">{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontWeight: '600', color: colors.ink2 },
  input: {
    minHeight: tapTarget + 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    color: colors.ink,
    fontSize: 16,
  },
  inputError: { borderColor: colors.error },
});

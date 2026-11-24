import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/text';
import { colors, radius, spacing, tapTarget } from '@/theme/tokens';

type Variant = 'primary' | 'gold' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  accessibilityHint,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}) {
  const off = disabled || loading;
  const v = VARIANTS[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy: loading }}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.base, v.box, pressed && !off && styles.pressed, off && styles.off, style]}>
      {loading ? <ActivityIndicator color={v.text} /> : <Text variant="bodyStrong" style={{ color: v.text }}>{title}</Text>}
    </Pressable>
  );
}

const VARIANTS: Record<Variant, { box: ViewStyle; text: string }> = {
  primary: { box: { backgroundColor: colors.ink }, text: colors.white },
  gold: { box: { backgroundColor: colors.gold2 }, text: colors.white },
  secondary: { box: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.lineStrong }, text: colors.ink },
  ghost: { box: { backgroundColor: 'transparent' }, text: colors.goldText },
  danger: { box: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.error }, text: colors.error },
};

const styles = StyleSheet.create({
  base: { minHeight: tapTarget + 6, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  pressed: { opacity: 0.85 },
  off: { opacity: 0.5 },
});

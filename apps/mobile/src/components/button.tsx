import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/text';
import { colors, radius, spacing, tapTarget } from '@/theme/tokens';

type Variant = 'gold' | 'primary' | 'secondary' | 'ghost' | 'danger';

/** Dégradé or des boutons du site (theme.css : --mo-grad). */
export const GOLD_GRADIENT = ['#EAD08A', '#CFA64A', '#AD8330'] as const;

export function Button({
  title,
  onPress,
  variant = 'gold',
  loading = false,
  disabled = false,
  compact = false,
  style,
  accessibilityHint,
  icon,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  icon?: React.ReactNode;
}) {
  const off = disabled || loading;
  const v = VARIANTS[variant];
  const content = loading ? (
    <ActivityIndicator color={v.text} />
  ) : (
    <View style={styles.content}>
      {icon}
      <Text variant={compact ? 'small' : 'bodyStrong'} style={[styles.label, { color: v.text }]} numberOfLines={1}>{title}</Text>
    </View>
  );
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: off, busy: loading }}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.base, compact && styles.compact, v.box, pressed && !off && styles.pressed, off && styles.off, style]}>
      {variant === 'gold' ? (
        <LinearGradient colors={GOLD_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, styles.gradient]} />
      ) : null}
      {content}
    </Pressable>
  );
}

const VARIANTS: Record<Variant, { box: ViewStyle; text: string }> = {
  gold: { box: { borderWidth: 1, borderColor: colors.gold2, shadowColor: '#A67C27', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }, text: colors.ink },
  primary: { box: { backgroundColor: colors.ink }, text: colors.white },
  secondary: { box: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.lineStrong }, text: colors.ink },
  ghost: { box: { backgroundColor: 'transparent' }, text: colors.goldText },
  danger: { box: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.error }, text: colors.error },
};

const styles = StyleSheet.create({
  base: { minHeight: tapTarget + 4, borderRadius: radius.sm + 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, overflow: 'hidden' },
  compact: { minHeight: 40, paddingHorizontal: spacing.sm },
  gradient: { borderRadius: radius.sm + 2 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontWeight: '700', letterSpacing: 0.1 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  off: { opacity: 0.5 },
});

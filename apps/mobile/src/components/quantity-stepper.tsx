import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors, radius, tapTarget } from '@/theme/tokens';

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  compact = false,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  compact?: boolean;
}) {
  const btn = (label: string, next: number, a11y: string, off: boolean) => (
    <Pressable
      onPress={() => onChange(next)}
      disabled={off || disabled}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      hitSlop={6}
      style={({ pressed }) => [styles.btn, compact && styles.btnCompact, (off || disabled) && styles.off, pressed && styles.pressed]}>
      <Text variant={compact ? 'bodyStrong' : 'title'} color="ink">{label}</Text>
    </Pressable>
  );
  return (
    <View style={[styles.row, compact && styles.rowCompact]} accessibilityRole="adjustable" accessibilityValue={{ min, max, now: value }}>
      {btn('−', value - 1, 'Diminuer la quantité', value <= min)}
      <Text variant="bodyStrong" style={[styles.value, compact && styles.valueCompact]}>{value}</Text>
      {btn('+', value + 1, 'Augmenter la quantité', value >= max)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.lineStrong, borderRadius: radius.pill, backgroundColor: colors.white },
  btn: { width: tapTarget, height: tapTarget, alignItems: 'center', justifyContent: 'center' },
  rowCompact: { alignSelf: 'stretch', justifyContent: 'space-between' },
  btnCompact: { width: 34, height: 40 },
  valueCompact: { minWidth: 20 },
  value: { minWidth: 28, textAlign: 'center' },
  off: { opacity: 0.3 },
  pressed: { opacity: 0.6 },
});

import { Pressable, StyleSheet, View } from 'react-native';

import type { Variation } from '@/api/store/schemas';
import { Text } from '@/components/text';
import { colors, radius, spacing, tapTarget } from '@/theme/tokens';
import { euros } from '@/utils/money';

/** Pastilles de poids (formats épuisés barrés), comme les cartes du site. */
export function WeightPicker({
  variations,
  selectedId,
  onSelect,
  compact = false,
}: {
  variations: Variation[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  compact?: boolean;
}) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]} accessibilityRole="radiogroup" accessibilityLabel="Poids">
      {variations.map((v) => {
        const active = v.id === selectedId;
        return (
          <Pressable
            key={v.id}
            onPress={() => onSelect(v.id)}
            disabled={!v.in_stock}
            hitSlop={compact ? 4 : 0}
            accessibilityRole="radio"
            accessibilityState={{ selected: active, disabled: !v.in_stock }}
            accessibilityLabel={`${v.label}, ${euros(v.price)}${v.in_stock ? '' : ', épuisé'}`}
            style={[styles.pill, compact && styles.pillCompact, active && styles.active, !v.in_stock && styles.off]}>
            <Text variant={compact ? 'caption' : 'bodyStrong'} color={active ? 'white' : 'ink'} style={[styles.label, !v.in_stock && styles.strike]}>
              {v.label}
            </Text>
            {!compact ? <Text variant="caption" color={active ? 'goldLight' : 'muted'}>{euros(v.price)}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Première déclinaison disponible (sélection par défaut). */
export const firstInStock = (variations: Variation[]) => variations.find((v) => v.in_stock)?.id ?? null;

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  wrapCompact: { gap: 6 },
  pill: {
    minHeight: tapTarget + 8,
    minWidth: 84,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.cream,
  },
  pillCompact: { minHeight: 32, minWidth: 0, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill },
  active: { backgroundColor: colors.ink, borderColor: colors.ink },
  off: { opacity: 0.45 },
  label: { fontWeight: '700' },
  strike: { textDecorationLine: 'line-through' },
});

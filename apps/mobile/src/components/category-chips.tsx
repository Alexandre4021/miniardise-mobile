import { useQuery } from '@tanstack/react-query';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text } from '@/components/text';
import { categoriesQuery } from '@/features/catalog/queries';
import { colors, radius, spacing, tapTarget } from '@/theme/tokens';
import { decodeEntities } from '@/utils/html';

export function CategoryChips({ selected, onSelect }: { selected?: number; onSelect: (id?: number) => void }) {
  const { data } = useQuery(categoriesQuery());
  if (!data?.length) return null;
  const chips = [{ id: undefined, name: 'Tout' }, ...data];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {chips.map((c) => {
        const active = c.id === selected;
        return (
          <Pressable
            key={c.id ?? 'all'}
            onPress={() => onSelect(c.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.chip, active && styles.chipActive]}>
            <Text variant="small" color={active ? 'white' : 'ink'}>{decodeEntities(c.name)}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    minHeight: tapTarget - 8,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
});

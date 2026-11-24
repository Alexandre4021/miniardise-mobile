import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { CategoryIcon } from '@/components/category-icon';
import { Text } from '@/components/text';
import { useStyledCategories } from '@/features/catalog/use-categories';
import { colors, radius, spacing, tapTarget } from '@/theme/tokens';

/** Filtres de la boutique : pastilles aux couleurs de chaque catégorie. */
export function CategoryChips({ selected, onSelect }: { selected?: number; onSelect: (id?: number) => void }) {
  const { items } = useStyledCategories();
  if (!items.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      <Pressable
        onPress={() => onSelect(undefined)}
        accessibilityRole="button"
        accessibilityState={{ selected: selected === undefined }}
        style={[styles.chip, selected === undefined && styles.allActive]}>
        <Text variant="small" color={selected === undefined ? 'white' : 'ink'}>Tout</Text>
      </Pressable>
      {items.map((c) => {
        const active = c.id === selected;
        return (
          <Pressable
            key={c.id}
            onPress={() => onSelect(c.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.chip, { backgroundColor: active ? c.style.accent : c.style.bg, borderColor: c.style.accent }]}>
            <CategoryIcon icon={c.style.icon} color={active ? colors.white : c.style.accent} size={20} />
            <Text variant="small" style={{ color: active ? colors.white : c.style.text, fontWeight: '600' }}>{c.name}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    minHeight: tapTarget - 4,
    paddingHorizontal: spacing.md - 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.white,
  },
  allActive: { backgroundColor: colors.ink, borderColor: colors.ink },
});

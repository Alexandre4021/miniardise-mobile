import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CategoryIcon } from '@/components/category-icon';
import { Text } from '@/components/text';
import { useStyledCategories } from '@/features/catalog/use-categories';
import { colors, spacing } from '@/theme/tokens';

// Pictogramme « Tout » : grille de 4 pastilles (style du thème, viewBox 48).
const ALL_ICON =
  '<rect x="9" y="9" width="12" height="12" rx="3"/><rect x="27" y="9" width="12" height="12" rx="3"/><rect x="9" y="27" width="12" height="12" rx="3"/><rect x="27" y="27" width="12" height="12" rx="3" fill="currentColor" fill-opacity=".18"/>';

/**
 * Pictogrammes colorés des catégories, comme la barre du site.
 * Accueil : simple navigation. Boutique : sélection (avec « Tout »).
 */
export function CategoryTiles({
  onSelect,
  selected,
  withAll = false,
}: {
  onSelect: (id?: number) => void;
  selected?: number;
  withAll?: boolean;
}) {
  const { items } = useStyledCategories();
  if (!items.length) return null;
  const selectable = withAll;
  const tiles = [
    ...(withAll ? [{ id: undefined, name: 'Tout', style: { bg: colors.champagne, accent: colors.ink2, text: colors.ink, icon: ALL_ICON } }] : []),
    ...items,
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {tiles.map((c) => {
        const active = selectable && c.id === selected;
        return (
          <Pressable
            key={c.id ?? 'all'}
            onPress={() => onSelect(c.id)}
            accessibilityRole="button"
            accessibilityLabel={c.id ? `Catégorie ${c.name}` : 'Toutes les catégories'}
            accessibilityState={selectable ? { selected: active } : undefined}
            style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
            <View
              style={[
                styles.circle,
                { backgroundColor: active ? c.style.accent : c.style.bg, borderColor: c.style.accent },
                active && styles.circleActive,
              ]}>
              <CategoryIcon icon={c.style.icon} color={active ? colors.white : c.style.accent} size={34} />
            </View>
            <Text variant="caption" numberOfLines={2} style={[styles.label, { color: c.style.text }, active && styles.labelActive]}>
              {c.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.md, paddingVertical: spacing.sm, paddingRight: spacing.md },
  tile: { width: 76, alignItems: 'center', gap: 6 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  circle: { width: 64, height: 64, borderRadius: 32, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  circleActive: { borderWidth: 3 },
  label: { textAlign: 'center', fontWeight: '600' },
  labelActive: { textDecorationLine: 'underline' },
});

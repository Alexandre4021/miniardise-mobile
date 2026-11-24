import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CategoryIcon } from '@/components/category-icon';
import { Text } from '@/components/text';
import { useStyledCategories } from '@/features/catalog/use-categories';
import { spacing } from '@/theme/tokens';

/** Accueil : pictogrammes colorés des catégories, comme la barre du site. */
export function CategoryTiles({ onSelect }: { onSelect: (id: number) => void }) {
  const { items } = useStyledCategories();
  if (!items.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map((c) => (
        <Pressable
          key={c.id}
          onPress={() => onSelect(c.id)}
          accessibilityRole="button"
          accessibilityLabel={`Catégorie ${c.name}`}
          style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
          <View style={[styles.circle, { backgroundColor: c.style.bg, borderColor: c.style.accent }]}>
            <CategoryIcon icon={c.style.icon} color={c.style.accent} size={34} />
          </View>
          <Text variant="caption" numberOfLines={2} style={[styles.label, { color: c.style.text }]}>{c.name}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.md, paddingVertical: spacing.sm, paddingRight: spacing.md },
  tile: { width: 76, alignItems: 'center', gap: 6 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  circle: { width: 64, height: 64, borderRadius: 32, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  label: { textAlign: 'center', fontWeight: '600' },
});

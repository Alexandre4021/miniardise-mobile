import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryChips } from '@/components/category-chips';
import { ProductGrid } from '@/components/product-grid';
import { Text } from '@/components/text';
import { useDebouncedValue } from '@/utils/use-debounced-value';
import { colors, radius, spacing, tapTarget } from '@/theme/tokens';

export function Shop({ initialCategory }: { initialCategory?: number }) {
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search, 350);
  // Catégorie choisie depuis l'accueil : on l'applique quand le paramètre change.
  const [lastInitial, setLastInitial] = useState(initialCategory);
  if (lastInitial !== initialCategory) {
    setLastInitial(initialCategory);
    setCategory(initialCategory);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.top}>
        <Text variant="display">Boutique</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un produit"
          placeholderTextColor={colors.muted}
          style={styles.search}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Rechercher un produit"
          clearButtonMode="while-editing"
        />
        <CategoryChips selected={category} onSelect={setCategory} />
      </View>
      <ProductGrid category={category} search={debounced.length >= 2 ? debounced : undefined} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  top: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.sm },
  search: {
    minHeight: tapTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    color: colors.ink,
    fontSize: 16,
  },
});

import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryTiles } from '@/components/category-tiles';
import { Hero } from '@/components/hero';
import { ProductGrid } from '@/components/product-grid';
import { Reassurance } from '@/components/reassurance';
import { Text } from '@/components/text';
import { colors, spacing } from '@/theme/tokens';

export function Home() {
  const goShop = (id?: number) =>
    router.navigate({ pathname: '/boutique', params: id ? { categorie: String(id) } : {} });

  const header = (
    <View style={styles.header}>
      <Hero onShop={() => goShop()} />
      <View style={styles.section}>
        <Text variant="title">Nos fruits secs</Text>
        <CategoryTiles onSelect={goShop} />
      </View>
      <Reassurance />
      <Text variant="title" style={styles.section}>Notre sélection</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ProductGrid header={header} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: { gap: spacing.lg, paddingBottom: spacing.sm },
  section: { gap: spacing.xs },
});

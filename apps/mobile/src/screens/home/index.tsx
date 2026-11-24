import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryChips } from '@/components/category-chips';
import { ProductGrid } from '@/components/product-grid';
import { Text } from '@/components/text';
import { colors, spacing } from '@/theme/tokens';

export function Home() {
  const header = (
    <View style={styles.header}>
      <View style={styles.brand}>
        <Image source={require('@/assets/images/logo-miniardise.png')} style={styles.logo} contentFit="contain" accessibilityLabel="MiniarDise" />
        <View style={styles.brandText}>
          <Text variant="display">Épicerie Fine MiniarDise</Text>
          <Text color="muted">Fruits secs premium, sélectionnés avec exigence.</Text>
        </View>
      </View>
      <CategoryChips onSelect={(id) => router.navigate({ pathname: '/boutique', params: id ? { categorie: String(id) } : {} })} />
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
  header: { gap: spacing.md, paddingBottom: spacing.sm },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm },
  logo: { width: 72, height: 72 },
  brandText: { flex: 1, gap: spacing.xs },
  section: { marginTop: spacing.sm },
});

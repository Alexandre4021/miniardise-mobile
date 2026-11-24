import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';

import { ProductCard } from '@/components/product-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/screen-state';
import { productListQuery } from '@/features/catalog/queries';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';
import { colors, spacing } from '@/theme/tokens';

export function ProductGrid({ category, search, header }: { category?: number; search?: string; header?: React.ReactElement }) {
  const q = useInfiniteQuery(productListQuery({ category, search }));
  const tabInset = useTabBarInset();
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];
  // L'en-tête (bandeau, catégories…) reste toujours visible ; seul le contenu de la grille
  // passe par les états chargement / erreur / vide.
  const empty = q.isPending ? (
    <LoadingState />
  ) : q.isError && !q.data ? (
    <ErrorState error={q.error} onRetry={() => void q.refetch()} />
  ) : (
    <EmptyState message="Aucun produit ne correspond." />
  );
  return (
    <FlatList
      data={items}
      keyExtractor={(p) => String(p.id)}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={[styles.content, { paddingBottom: spacing.md + tabInset }]}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      renderItem={({ item }) => (
        <View style={styles.cell}>
          <ProductCard product={item} />
        </View>
      )}
      onEndReachedThreshold={0.5}
      onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
      refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.gold2} />}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, backgroundColor: colors.cream, flexGrow: 1 },
  row: { gap: spacing.md },
  cell: { flex: 1 / 2 },
});

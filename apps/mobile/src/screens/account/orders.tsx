import { useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { fetchOrders, type OrderSummary } from '@/api/mobile/account';
import { EmptyState, ErrorState, LoadingState } from '@/components/screen-state';
import { Text } from '@/components/text';
import { colors, radius, spacing } from '@/theme/tokens';
import { euros } from '@/utils/money';
import { statusTone } from '@/utils/order-status';

export const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  const tone = statusTone(status);
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text variant="caption" style={{ color: tone.text, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

export function OrdersScreen() {
  const q = useInfiniteQuery({
    queryKey: ['account', 'orders'],
    queryFn: ({ pageParam, signal }) => fetchOrders(pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.total_pages ? last.page + 1 : undefined),
  });
  if (q.isPending) return <LoadingState />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />;
  const orders = q.data.pages.flatMap((p) => p.orders);

  return (
    <FlatList<OrderSummary>
      data={orders}
      keyExtractor={(o) => String(o.id)}
      style={styles.bg}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<EmptyState message="Vous n’avez pas encore passé de commande." />}
      onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
      refreshing={q.isRefetching}
      onRefresh={() => void q.refetch()}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push({ pathname: '/commandes/[id]', params: { id: String(item.id) } })}
          accessibilityRole="button"
          accessibilityLabel={`Commande ${item.number} du ${formatDate(item.date)}, ${item.status_label}, ${euros(item.total)}`}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
          <View style={styles.row}>
            <Text variant="bodyStrong">Commande n° {item.number}</Text>
            <StatusBadge status={item.status} label={item.status_label} />
          </View>
          <Text variant="small" color="muted">{formatDate(item.date)} · {item.item_count} article{item.item_count > 1 ? 's' : ''}</Text>
          <Text variant="bodyStrong" color="goldText">{euros(item.total)}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: colors.cream },
  list: { padding: spacing.md, gap: spacing.md, flexGrow: 1 },
  card: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: spacing.md, gap: 6 },
  pressed: { opacity: 0.8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm + 2, paddingVertical: 3 },
});

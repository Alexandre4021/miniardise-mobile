import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { fetchOrder } from '@/api/mobile/account';
import { ErrorState, LoadingState } from '@/components/screen-state';
import { Text } from '@/components/text';
import { formatDate, StatusBadge } from '@/screens/account/orders';
import { LOGO } from '@/theme/assets';
import { colors, radius, spacing } from '@/theme/tokens';
import { euros } from '@/utils/money';

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text variant={strong ? 'title' : 'body'}>{label}</Text>
      <Text variant={strong ? 'title' : 'bodyStrong'} color={strong ? 'goldText' : 'ink'}>{value}</Text>
    </View>
  );
}

export function OrderDetailScreen({ id }: { id: number }) {
  const q = useQuery({ queryKey: ['account', 'order', id], queryFn: ({ signal }) => fetchOrder(id, signal) });
  if (q.isPending) return <LoadingState />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />;
  const o = q.data;

  return (
    <>
      <Stack.Screen options={{ title: `Commande n° ${o.number}` }} />
      <ScrollView style={styles.bg} contentContainerStyle={styles.body}>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text color="muted">{formatDate(o.date)}</Text>
            <StatusBadge status={o.status} label={o.status_label} />
          </View>
        </View>

        <View style={styles.card}>
          <Text variant="title">Articles</Text>
          {o.items.map((it, i) => (
            <View key={i} style={styles.item}>
              <Image source={it.image ? { uri: it.image } : LOGO} style={styles.thumb} contentFit="cover" alt="" />
              <View style={styles.flex}>
                <Text variant="bodyStrong">{it.name}</Text>
                <Text variant="small" color="muted">Quantité : {it.quantity}</Text>
              </View>
              <Text variant="bodyStrong">{euros(it.total)}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, styles.totals]}>
          <Row label="Sous-total" value={euros(o.subtotal)} />
          {o.discount_total > 0 ? <Row label="Remise" value={`− ${euros(o.discount_total)}`} /> : null}
          <Row label="Livraison" value={o.shipping_total === 0 ? 'Offerte' : euros(o.shipping_total)} />
          <Row label="Total TTC" value={euros(o.total)} strong />
          <Text variant="caption" color="muted">dont TVA {euros(o.tax_total)}</Text>
        </View>

        <View style={styles.card}>
          <Text variant="title">Livraison</Text>
          {o.shipping_methods.map((m) => <Text key={m}>{m}</Text>)}
          {o.shipping_address.length ? o.shipping_address.map((l, i) => <Text key={i} color="ink2">{l}</Text>) : null}
        </View>

        <View style={styles.card}>
          <Text variant="title">Paiement</Text>
          <Text>{o.payment_method || '—'}</Text>
          {o.billing_address.map((l, i) => <Text key={i} variant="small" color="muted">{l}</Text>)}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: colors.cream },
  body: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  flex: { flex: 1 },
  card: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: spacing.md, gap: spacing.sm },
  totals: { backgroundColor: colors.champagne },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2 },
  thumb: { width: 52, height: 52, borderRadius: radius.sm, backgroundColor: colors.champagne },
});

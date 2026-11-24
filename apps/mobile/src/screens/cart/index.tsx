import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { userMessage } from '@/api/errors';
import { fetchAddresses } from '@/api/mobile/account';
import type { Cart, CartItem } from '@/api/store/cart';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/button';
import { QuantityStepper } from '@/components/quantity-stepper';
import { ErrorState, LoadingState } from '@/components/screen-state';
import { Text } from '@/components/text';
import { TextField } from '@/components/text-field';
import { useAuth } from '@/features/auth/auth-context';
import {
  useApplyCoupon,
  useCart,
  useRemoveCartItem,
  useRemoveCoupon,
  useSelectShippingRate,
  useShippingDestination,
  useUpdateCartItem,
} from '@/features/cart/use-cart';
import { LOGO } from '@/theme/assets';
import { colors, radius, spacing } from '@/theme/tokens';
import { formatAmount } from '@/utils/format-price';
import { decodeEntities } from '@/utils/html';
import { addMinor } from '@/utils/money';

const money = (minor: string | null | undefined, c: Cart['totals']) => formatAmount(minor ?? '0', c);

export function CartScreen() {
  const cart = useCart();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader />
      {cart.isPending ? (
        <LoadingState />
      ) : cart.isError ? (
        <ErrorState error={cart.error} onRetry={() => void cart.refetch()} />
      ) : cart.data.items.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="title">Votre panier est vide</Text>
          <Text color="muted" style={styles.center}>Découvrez nos fruits secs premium et composez votre commande.</Text>
          <Button title="Découvrir la boutique" onPress={() => router.navigate('/boutique')} />
        </View>
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <FlatList
            data={cart.data.items}
            keyExtractor={(i) => i.key}
            contentContainerStyle={styles.list}
            ListHeaderComponent={<Text variant="title">Mon panier ({cart.data.items_count})</Text>}
            renderItem={({ item }) => <CartLine item={item} />}
            ListFooterComponent={<CartFooter cart={cart.data} refreshing={cart.isFetching} />}
            refreshing={cart.isRefetching}
            onRefresh={() => void cart.refetch()}
            keyboardShouldPersistTaps="handled"
          />
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

function CartLine({ item }: { item: CartItem }) {
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const busy = update.isPending || remove.isPending;
  const total = addMinor(item.totals.line_total, item.totals.line_total_tax);
  const variation = item.variation.map((v) => decodeEntities(v.value)).join(', ');
  const error = update.error ?? remove.error;

  return (
    <View style={[styles.line, busy && styles.busy]}>
      <Image source={item.images[0] ? { uri: item.images[0].thumbnail } : LOGO} style={styles.thumb} contentFit="cover" alt="" />
      <View style={styles.lineBody}>
        <Text variant="bodyStrong" numberOfLines={2}>{decodeEntities(item.name)}</Text>
        {variation ? <Text variant="small" color="muted">{variation}</Text> : null}
        <View style={styles.lineRow}>
          <QuantityStepper
            value={item.quantity}
            min={item.quantity_limits.minimum}
            max={item.quantity_limits.maximum}
            disabled={!item.quantity_limits.editable || busy}
            onChange={(q) => update.mutate({ key: item.key, quantity: q })}
          />
          <Text variant="bodyStrong" color="goldText">{formatAmount(total, item.totals)}</Text>
        </View>
        <Pressable onPress={() => remove.mutate(item.key)} disabled={busy} accessibilityRole="button" hitSlop={8}>
          <Text variant="small" color="error">Retirer</Text>
        </Pressable>
        {error ? <Text variant="caption" color="error">{userMessage(error)}</Text> : null}
      </View>
    </View>
  );
}

function CartFooter({ cart, refreshing }: { cart: Cart; refreshing: boolean }) {
  const t = cart.totals;
  const discount = addMinor(t.total_discount, t.total_discount_tax);
  const shipping = t.total_shipping === null ? null : addMinor(t.total_shipping, t.total_shipping_tax);

  return (
    <View style={styles.footer}>
      {cart.errors.map((e) => (
        <Text key={e.code} variant="small" color="error">{decodeEntities(e.message)}</Text>
      ))}
      <Coupons cart={cart} />
      {cart.needs_shipping ? <Shipping cart={cart} /> : null}

      <View style={styles.totals}>
        <Row label="Sous-total" value={money(addMinor(t.total_items, t.total_items_tax), t)} />
        {Number(discount) > 0 ? <Row label="Remise" value={`− ${money(discount, t)}`} /> : null}
        <Row label="Livraison" value={shipping === null ? 'Calculée selon l’adresse' : Number(shipping) === 0 ? 'Offerte' : money(shipping, t)} />
        <View style={styles.sep} />
        <Row label="Total TTC" value={money(t.total_price, t)} strong />
        <Text variant="caption" color="muted">dont TVA {money(t.total_tax, t)}{refreshing ? ' · mise à jour…' : ''}</Text>
      </View>

      <Button title="Commander" onPress={() => undefined} disabled accessibilityHint="Le paiement dans l'application arrive bientôt" />
      <Text variant="caption" color="muted" style={styles.center}>
        Le paiement sécurisé dans l’application arrive très bientôt. Votre panier est conservé.
      </Text>
    </View>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text variant={strong ? 'title' : 'body'}>{label}</Text>
      <Text variant={strong ? 'title' : 'bodyStrong'} color={strong ? 'goldText' : 'ink'}>{value}</Text>
    </View>
  );
}

function Coupons({ cart }: { cart: Cart }) {
  const [code, setCode] = useState('');
  const apply = useApplyCoupon();
  const remove = useRemoveCoupon();
  return (
    <View style={styles.box}>
      <Text variant="bodyStrong">Code promo</Text>
      {cart.coupons.map((c) => (
        <View key={c.code} style={styles.row}>
          <Text>{c.code.toUpperCase()}</Text>
          <Pressable onPress={() => remove.mutate(c.code)} accessibilityRole="button" hitSlop={8}>
            <Text variant="small" color="error">Retirer</Text>
          </Pressable>
        </View>
      ))}
      <View style={styles.couponRow}>
        <View style={styles.flex}>
          <TextField label="Saisir un code" value={code} onChangeText={setCode} autoCapitalize="characters" autoCorrect={false} returnKeyType="done" />
        </View>
        <Button
          title="Appliquer"
          variant="secondary"
          onPress={() => apply.mutate(code, { onSuccess: () => setCode('') })}
          loading={apply.isPending}
          disabled={!code.trim()}
          style={styles.couponBtn}
        />
      </View>
      {apply.isError ? <Text variant="small" color="error" accessibilityRole="alert">{userMessage(apply.error)}</Text> : null}
    </View>
  );
}

function Shipping({ cart }: { cart: Cart }) {
  const { status } = useAuth();
  const saved = useQuery({ queryKey: ['account', 'addresses'], queryFn: ({ signal }) => fetchAddresses(signal), enabled: status === 'signedIn' });
  const dest = useShippingDestination();
  const select = useSelectShippingRate();
  const current = cart.shipping_address;
  const [postcode, setPostcode] = useState(current.postcode ?? '');
  const [city, setCity] = useState(current.city ?? '');
  const packages = cart.shipping_rates;
  const hasRates = packages.some((p) => p.shipping_rates.length > 0);

  const useSaved = () => {
    const s = saved.data?.shipping.postcode ? saved.data.shipping : saved.data?.billing;
    if (s) dest.mutate({ postcode: s.postcode, city: s.city, country: s.country || 'FR' });
  };

  return (
    <View style={styles.box}>
      <Text variant="bodyStrong">Livraison</Text>
      {!hasRates || !current.postcode ? (
        <>
          <Text variant="small" color="muted">Indiquez votre code postal pour voir les modes de livraison et leurs tarifs.</Text>
          <View style={styles.couponRow}>
            <View style={styles.flex}>
              <TextField label="Code postal" value={postcode} onChangeText={setPostcode} keyboardType="number-pad" maxLength={5} />
            </View>
            <View style={styles.flex}>
              <TextField label="Ville" value={city} onChangeText={setCity} autoCapitalize="words" />
            </View>
          </View>
          <Button
            title="Voir les livraisons"
            variant="secondary"
            onPress={() => dest.mutate({ postcode: postcode.trim(), city: city.trim(), country: 'FR' })}
            loading={dest.isPending}
            disabled={!/^\d{5}$/.test(postcode.trim()) || !city.trim()}
          />
          {saved.data && (saved.data.shipping.postcode || saved.data.billing.postcode) ? (
            <Button title="Utiliser mon adresse enregistrée" variant="ghost" onPress={useSaved} />
          ) : null}
        </>
      ) : (
        <Text variant="small" color="muted">
          Pour {current.postcode} {current.city}
        </Text>
      )}
      {packages.map((pkg) =>
        pkg.shipping_rates.map((r) => (
          <Pressable
            key={`${pkg.package_id}-${r.rate_id}`}
            onPress={() => select.mutate({ packageId: pkg.package_id, rateId: r.rate_id })}
            accessibilityRole="radio"
            accessibilityState={{ selected: r.selected }}
            style={[styles.rate, r.selected && styles.rateActive]}>
            <View style={[styles.radio, r.selected && styles.radioOn]} />
            <View style={styles.flex}>
              <Text variant="bodyStrong">{decodeEntities(r.name)}</Text>
              {r.delivery_time ? <Text variant="caption" color="muted">{r.delivery_time}</Text> : null}
            </View>
            <Text variant="bodyStrong">{Number(addMinor(r.price, r.taxes)) === 0 ? 'Offerte' : formatAmount(addMinor(r.price, r.taxes), r)}</Text>
          </Pressable>
        )),
      )}
      {hasRates && current.postcode ? (
        <Text variant="caption" color="muted">Le choix du point relais se fera à l’étape de commande.</Text>
      ) : null}
      {dest.isError || select.isError ? (
        <Text variant="small" color="error">{userMessage(dest.error ?? select.error)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  list: { padding: spacing.md, gap: spacing.md },
  line: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: spacing.sm + 4 },
  busy: { opacity: 0.6 },
  thumb: { width: 76, height: 76, borderRadius: radius.sm, backgroundColor: colors.champagne },
  lineBody: { flex: 1, gap: 6 },
  lineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  footer: { gap: spacing.md, marginTop: spacing.sm },
  box: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: spacing.md, gap: spacing.sm },
  couponRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  couponBtn: { paddingHorizontal: spacing.md },
  rate: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm + 2, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line },
  rateActive: { borderColor: colors.gold2, backgroundColor: colors.cream },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.lineStrong },
  radioOn: { borderColor: colors.gold2, backgroundColor: colors.gold2 },
  totals: { backgroundColor: colors.champagne, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sep: { height: 1, backgroundColor: colors.lineStrong },
});

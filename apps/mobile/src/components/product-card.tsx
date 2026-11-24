import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { userMessage } from '@/api/errors';
import { productVariations, type Product } from '@/api/store/schemas';
import { Button } from '@/components/button';
import { QuantityStepper } from '@/components/quantity-stepper';
import { Text } from '@/components/text';
import { firstInStock, WeightPicker } from '@/components/weight-picker';
import { useAddToCart } from '@/features/cart/use-cart';
import { LOGO } from '@/theme/assets';
import { colors, radius, spacing } from '@/theme/tokens';
import { priceLabel } from '@/utils/format-price';
import { decodeEntities } from '@/utils/html';
import { euros } from '@/utils/money';

const CART_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>';
const CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

/** Carte produit comme sur le site : photo, nom, prix, poids, quantité, ajout au panier. */
export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];
  const name = decodeEntities(product.name);
  const variations = productVariations(product);
  const hasVariations = variations.length > 0;
  const [chosen, setChosen] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const add = useAddToCart();

  const selectedId = chosen ?? firstInStock(variations);
  const selected = variations.find((v) => v.id === selectedId) ?? null;
  // Produit variable sans données de poids (extension pas à jour) : on renvoie vers la fiche.
  const canQuickBuy = hasVariations ? !!selected?.in_stock : product.type === 'simple' && product.is_in_stock;
  // Données de poids reçues mais aucun format publié (produit variable sans déclinaison) : indisponible.
  const knownEmpty = !!product.extensions?.['miniardise-mobile'] && product.type === 'variable' && !hasVariations;
  const soldOut = hasVariations ? !variations.some((v) => v.in_stock) : knownEmpty || !product.is_in_stock;

  // Retour à « Ajouter » après 2,5 s (minuteur annulé si la carte disparaît).
  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 2500);
    return () => clearTimeout(t);
  }, [added]);

  const onAdd = () => {
    setAdded(false);
    add.mutate(
      { id: hasVariations ? selected!.id : product.id, quantity: qty },
      {
        onSuccess: () => {
          setAdded(true);
          setQty(1);
        },
      },
    );
  };

  return (
    <View style={styles.card}>
      <Link href={{ pathname: '/produit/[id]', params: { id: String(product.id) } }} asChild>
        <Pressable accessibilityRole="link" accessibilityLabel={`Voir la fiche ${name}`} style={({ pressed }) => pressed && styles.pressed}>
          <Image
            source={image ? { uri: image.thumbnail } : LOGO}
            style={styles.image}
            contentFit={image ? 'cover' : 'contain'}
            transition={150}
            alt={image?.alt ?? ''}
          />
          <View style={styles.head}>
            <Text variant="bodyStrong" numberOfLines={2} style={styles.name}>{name}</Text>
            <Text variant="bodyStrong" color="goldText">
              {selected ? euros(selected.price) : priceLabel(product.prices)}
            </Text>
          </View>
        </Pressable>
      </Link>

      <View style={styles.actions}>
        {hasVariations ? (
          <WeightPicker
            compact
            variations={variations}
            selectedId={selectedId}
            onSelect={(id) => {
              setChosen(id);
              setQty(1);
            }}
          />
        ) : null}
        {soldOut ? (
          <Text variant="small" color="error" style={styles.soldOut}>{knownEmpty ? 'Indisponible' : 'Épuisé'}</Text>
        ) : canQuickBuy ? (
          <>
            <QuantityStepper compact value={qty} onChange={setQty} max={selected?.max ?? 99} />
            <Button
              title={added ? 'Ajouté' : 'Ajouter'}
              compact
              variant={added ? 'primary' : 'gold'}
              loading={add.isPending}
              onPress={onAdd}
              icon={<SvgXml xml={added ? CHECK_ICON : CART_ICON} color={added ? colors.goldLight : colors.ink} width={16} height={16} />}
              accessibilityHint={`Ajoute ${qty} ${name} au panier`}
            />
          </>
        ) : (
          <Link href={{ pathname: '/produit/[id]', params: { id: String(product.id) } }} asChild>
            <Pressable accessibilityRole="link" style={styles.choose}>
              <Text variant="small" color="goldText" style={styles.bold}>Choisir</Text>
            </Pressable>
          </Link>
        )}
        {add.isError ? <Text variant="caption" color="error">{userMessage(add.error)}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.85 },
  image: { width: '100%', aspectRatio: 1, backgroundColor: colors.champagne },
  head: { paddingHorizontal: spacing.sm + 2, paddingTop: spacing.sm + 2, gap: 2 },
  name: { minHeight: 48 },
  actions: { padding: spacing.sm + 2, gap: spacing.sm },
  soldOut: { fontWeight: '700' },
  choose: { minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, borderWidth: 1, borderColor: colors.lineStrong },
  bold: { fontWeight: '700' },
});

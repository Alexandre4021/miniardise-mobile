import { LOGO } from '@/theme/assets';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Product } from '@/api/store/schemas';
import { Text } from '@/components/text';
import { colors, radius, spacing } from '@/theme/tokens';
import { priceLabel } from '@/utils/format-price';
import { decodeEntities } from '@/utils/html';

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];
  const name = decodeEntities(product.name);
  const price = priceLabel(product.prices);
  return (
    <Link href={{ pathname: '/produit/[id]', params: { id: String(product.id) } }} asChild>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        accessibilityRole="link"
        accessibilityLabel={`${name}, ${price}${product.is_in_stock ? '' : ', épuisé'}`}>
        <Image
          source={image ? { uri: image.thumbnail } : LOGO}
          style={styles.image}
          contentFit={image ? 'cover' : 'contain'}
          transition={150}
          accessibilityIgnoresInvertColors
          alt={image?.alt ?? ''}
        />
        <View style={styles.body}>
          <Text variant="bodyStrong" numberOfLines={2}>{name}</Text>
          <Text variant="bodyStrong" color="goldText">{price}</Text>
          {!product.is_in_stock ? <Text variant="caption" color="error">Épuisé</Text> : null}
        </View>
      </Pressable>
    </Link>
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
  body: { padding: spacing.sm + 4, gap: spacing.xs },
});

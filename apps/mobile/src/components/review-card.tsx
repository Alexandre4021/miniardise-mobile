import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import type { Review } from '@/api/mobile/catalog';
import { Stars } from '@/components/stars';
import { Text } from '@/components/text';
import { colors, radius, spacing } from '@/theme/tokens';

export function formatReviewDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function ReviewCard({ review, showProduct = false }: { review: Review; showProduct?: boolean }) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Stars value={review.rating} />
        <Text variant="caption" color="muted">{formatReviewDate(review.date)}</Text>
      </View>
      {review.text ? <Text>“{review.text}”</Text> : null}
      {review.photo ? (
        <Image source={{ uri: review.photo }} style={styles.photo} contentFit="cover" alt={`Photo de ${review.author}`} />
      ) : null}
      <View style={styles.meta}>
        <Text variant="small" style={styles.author}>{review.author}</Text>
        {review.verified ? (
          <View style={styles.badge}>
            <Text variant="caption" style={styles.badgeText}>Acheteur vérifié</Text>
          </View>
        ) : null}
      </View>
      {showProduct && review.product_name ? <Text variant="caption" color="goldText">{review.product_name}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: spacing.md, gap: spacing.sm },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.sm, backgroundColor: colors.champagne },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  author: { fontWeight: '700' },
  badge: { backgroundColor: '#E3F0DA', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  badgeText: { color: colors.success, fontWeight: '700' },
});

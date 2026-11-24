import { useQuery } from '@tanstack/react-query';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { fetchLatestReviews } from '@/api/mobile/catalog';
import { ReviewCard } from '@/components/review-card';
import { Stars } from '@/components/stars';
import { Text } from '@/components/text';
import { spacing } from '@/theme/tokens';

/** « Ils ont goûté nos fruits secs » : derniers avis, comme l'accueil du site (≥ 3 avis). */
export function LatestReviews() {
  const { width } = useWindowDimensions();
  const { data } = useQuery({ queryKey: ['reviews', 'latest'], queryFn: ({ signal }) => fetchLatestReviews(signal), staleTime: 5 * 60_000 });
  if (!data?.items.length) return null;
  return (
    <View style={styles.wrap}>
      <Text variant="title">Ils ont goûté nos fruits secs</Text>
      <View style={styles.avg}>
        <Stars value={data.average} size={18} />
        <Text variant="bodyStrong">{data.average.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}/5</Text>
        <Text variant="small" color="muted">{data.count} avis</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} snapToInterval={width * 0.8 + spacing.md} decelerationRate="fast">
        {data.items.map((r) => (
          <View key={r.id} style={{ width: width * 0.8 }}>
            <ReviewCard review={r} showProduct />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  avg: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  row: { gap: spacing.md, paddingRight: spacing.md },
});

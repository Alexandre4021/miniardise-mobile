import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { ErrorState, LoadingState } from '@/components/screen-state';
import { Text } from '@/components/text';
import { productQuery } from '@/features/catalog/queries';
import { colors, radius, spacing, tapTarget } from '@/theme/tokens';
import { priceLabel } from '@/utils/format-price';
import { decodeEntities, htmlToText } from '@/utils/html';

export function ProductDetail({ id }: { id: number }) {
  const { width } = useWindowDimensions();
  const q = useQuery(productQuery(id));
  const [weight, setWeight] = useState<string | null>(null);

  if (q.isPending) return <LoadingState />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;

  const p = q.data;
  const name = decodeEntities(p.name);
  const weights = p.attributes.find((a) => a.has_variations)?.terms ?? [];
  const intro = htmlToText(p.short_description);
  const description = htmlToText(p.description);

  return (
    <>
      <Stack.Screen options={{ title: name }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} accessibilityLabel="Photos du produit">
          {(p.images.length ? p.images : [null]).map((img, i) => (
            <Image
              key={img?.id ?? i}
              source={img ? { uri: img.src } : require('@/assets/images/logo-miniardise.png')}
              style={{ width, height: width, backgroundColor: colors.champagne }}
              contentFit={img ? 'cover' : 'contain'}
              alt={img?.alt ?? ''}
              transition={150}
            />
          ))}
        </ScrollView>

        <View style={styles.body}>
          <Text variant="display">{name}</Text>
          <Text variant="title" color="goldText">{priceLabel(p.prices)}</Text>
          <Text variant="small" color={p.is_in_stock ? 'success' : 'error'}>
            {p.is_in_stock ? 'En stock' : 'Épuisé'}
          </Text>

          {weights.length > 0 ? (
            <View style={styles.block}>
              <Text variant="bodyStrong">Poids</Text>
              <View style={styles.weights}>
                {weights.map((t) => {
                  const active = weight === t.slug;
                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => setWeight(t.slug)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      style={[styles.weight, active && styles.weightActive]}>
                      <Text color={active ? 'white' : 'ink'}>{t.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={[styles.cta, styles.ctaDisabled]} accessibilityState={{ disabled: true }}>
            <Text variant="bodyStrong" color="muted">Ajout au panier : prochaine étape</Text>
          </View>

          {intro ? <Text>{intro}</Text> : null}
          {description ? (
            <View style={styles.block}>
              <Text variant="title">Description</Text>
              <Text>{description}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { backgroundColor: colors.cream, paddingBottom: spacing.xxl },
  body: { padding: spacing.md, gap: spacing.md },
  block: { gap: spacing.sm },
  weights: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  weight: {
    minHeight: tapTarget,
    minWidth: 72,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.white,
  },
  weightActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  cta: { minHeight: 52, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  ctaDisabled: { backgroundColor: colors.sand },
});

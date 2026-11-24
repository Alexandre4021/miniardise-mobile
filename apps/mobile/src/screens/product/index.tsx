import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { type ComponentRef, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { userMessage } from '@/api/errors';
import { fetchProductDetails, type ProductSheet, type ReviewsBlock, type Variation } from '@/api/mobile/catalog';
import { Button } from '@/components/button';
import { QuantityStepper } from '@/components/quantity-stepper';
import { ReviewCard } from '@/components/review-card';
import { ErrorState, LoadingState } from '@/components/screen-state';
import { ICONS, SectionCard } from '@/components/section-card';
import { Stars } from '@/components/stars';
import { Text } from '@/components/text';
import { WeightPicker } from '@/components/weight-picker';
import { productVariations } from '@/api/store/schemas';
import { productQuery } from '@/features/catalog/queries';
import { useAddToCart } from '@/features/cart/use-cart';
import { LOGO } from '@/theme/assets';
import { colors, radius, spacing } from '@/theme/tokens';
import { priceLabel } from '@/utils/format-price';
import { decodeEntities, htmlToText } from '@/utils/html';
import { euros } from '@/utils/money';

type SectionId = 'desc' | 'benefits' | 'recipes' | 'detail' | 'storage' | 'reviews';

export function ProductDetail({ productRef }: { productRef: number | string }) {
  const { width } = useWindowDimensions();
  const product = useQuery(productQuery(productRef));
  const productId = product.data?.id;
  const details = useQuery({
    queryKey: ['catalog', 'details', productId],
    queryFn: ({ signal }) => fetchProductDetails(productId!, signal),
    enabled: !!productId,
    staleTime: 2 * 60_000,
  });

  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  // Positions des sections (objet stable, mis à jour par onLayout ; ne sert pas au rendu).
  const [offsets] = useState<Partial<Record<SectionId, number>>>(() => ({}));
  const mark = (id: SectionId) => (e: { nativeEvent: { layout: { y: number } } }) => {
    offsets[id] = e.nativeEvent.layout.y;
  };
  const goTo = (id: SectionId) => scroll.current?.scrollTo({ y: Math.max(0, (offsets[id] ?? 0) - spacing.sm), animated: true });

  if (product.isPending) return <LoadingState />;
  if (product.isError) return <ErrorState error={product.error} onRetry={() => void product.refetch()} />;

  const p = product.data;
  const name = decodeEntities(p.name);
  const sheet = details.data?.sheet ?? null;
  const reviews = details.data?.reviews;

  return (
    <>
      <Stack.Screen options={{ title: name }} />
      <ScrollView ref={scroll} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <Gallery images={p.images} width={width} />

        <View style={styles.body}>
          <Text variant="display">{name}</Text>
          {reviews && reviews.count > 0 ? (
            <Pressable onPress={() => goTo('reviews')} accessibilityRole="link" style={styles.ratingRow}>
              <Stars value={reviews.average} />
              <Text variant="small" color="goldText">{reviews.count} avis</Text>
            </Pressable>
          ) : null}

          <BuyBox
            productId={p.id}
            variations={details.data?.variations ?? (productVariations(p).length ? productVariations(p) : undefined)}
            fallbackPrice={priceLabel(p.prices)}
            inStock={p.is_in_stock}
            isVariable={p.type === 'variable'}
            loadingVariations={details.isPending}
          />

          {sheet ? (
            <SheetNav sheet={sheet} hasReviews={!!reviews} onGo={goTo} />
          ) : null}

          <View onLayout={mark('desc')} style={styles.desc}>
            <Text variant="caption" style={styles.kicker}>DESCRIPTION</Text>
            {sheet ? (
              <>
                {sheet.lead ? <Text style={styles.lead}>{sheet.lead}</Text> : null}
                {sheet.text ? sheet.text.split('\n\n').map((para, i) => <Text key={i} color="ink2">{para}</Text>) : null}
              </>
            ) : (
              <Text color="ink2">{htmlToText(p.description) || htmlToText(p.short_description)}</Text>
            )}
          </View>

          {sheet ? <SheetSections sheet={sheet} mark={mark} /> : null}

          <View onLayout={mark('reviews')}>
            <ReviewsSection block={reviews} loading={details.isPending} />
          </View>
        </View>
      </ScrollView>
    </>
  );
}

function Gallery({ images, width }: { images: { id: number; src: string; alt: string }[]; width: number }) {
  const [index, setIndex] = useState(0);
  const list = images.length ? images : [null];
  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        accessibilityLabel="Photos du produit">
        {list.map((img, i) => (
          <Image
            key={img?.id ?? i}
            source={img ? { uri: img.src } : LOGO}
            style={{ width, height: width, backgroundColor: colors.champagne }}
            contentFit={img ? 'cover' : 'contain'}
            alt={img?.alt ?? ''}
            transition={150}
          />
        ))}
      </ScrollView>
      {list.length > 1 ? (
        <View style={styles.dots}>
          {list.map((_, i) => <View key={i} style={[styles.dot, i === index && styles.dotActive]} />)}
        </View>
      ) : null}
    </View>
  );
}

function BuyBox({
  productId,
  variations,
  fallbackPrice,
  inStock,
  isVariable,
  loadingVariations,
}: {
  productId: number;
  variations?: Variation[];
  fallbackPrice: string;
  inStock: boolean;
  isVariable: boolean;
  loadingVariations: boolean;
}) {
  const firstAvailable = variations?.find((v) => v.in_stock)?.id ?? null;
  const [chosen, setChosen] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const add = useAddToCart();

  const selectedId = chosen ?? firstAvailable;
  const selected = variations?.find((v) => v.id === selectedId) ?? null;
  const hasVariations = (variations?.length ?? 0) > 0;
  // Produit variable sans format publié : rien à ajouter au panier.
  const noFormat = isVariable && !hasVariations && !loadingVariations;
  const canBuy = hasVariations ? !!selected?.in_stock : inStock && !isVariable;
  const max = selected?.max ?? 99;

  const onAdd = () => {
    setAdded(false);
    add.mutate(
      { id: hasVariations ? selected!.id : productId, quantity: qty },
      { onSuccess: () => setAdded(true) },
    );
  };

  return (
    <View style={styles.buy}>
      <Text variant="display" color="goldText" style={styles.price}>
        {selected ? euros(selected.price * qty) : fallbackPrice}
      </Text>
      {selected && qty > 1 ? <Text variant="caption" color="muted">{euros(selected.price)} l’unité</Text> : null}

      {hasVariations ? (
        <View style={styles.block}>
          <Text variant="bodyStrong">Poids</Text>
          <WeightPicker
            variations={variations!}
            selectedId={selectedId}
            onSelect={(id) => {
              setChosen(id);
              setQty(1);
              setAdded(false);
            }}
          />
        </View>
      ) : loadingVariations ? <Text variant="small" color="muted">Chargement des formats…</Text> : null}

      {loadingVariations && isVariable ? null : (
        <Text variant="small" color={canBuy ? 'success' : 'error'}>
          {canBuy ? 'En stock' : noFormat ? 'Indisponible pour le moment' : 'Épuisé'}
        </Text>
      )}

      <View style={styles.buyRow}>
        <QuantityStepper value={qty} onChange={setQty} max={max} disabled={!canBuy} />
        <Button
          title="Ajouter au panier"
          variant="gold"
          onPress={onAdd}
          loading={add.isPending}
          disabled={!canBuy || (hasVariations && !selected)}
          style={styles.addBtn}
        />
      </View>
      {add.isError ? <Text variant="small" color="error" accessibilityRole="alert">{userMessage(add.error)}</Text> : null}
      {added ? (
        <View style={styles.added} accessibilityLiveRegion="polite">
          <Text variant="small" color="success" style={styles.addedText}>Ajouté au panier ✓</Text>
          <Button title="Voir le panier" variant="ghost" onPress={() => router.navigate('/panier')} />
        </View>
      ) : null}
    </View>
  );
}

function SheetNav({ sheet, hasReviews, onGo }: { sheet: ProductSheet; hasReviews: boolean; onGo: (id: SectionId) => void }) {
  const items: [SectionId, string][] = useMemo(() => {
    const out: [SectionId, string][] = [['desc', 'Description']];
    if (sheet.benefits.length) out.push(['benefits', 'Bienfaits']);
    if (sheet.recipes.length) out.push(['recipes', 'Recettes']);
    out.push(['detail', 'Détail du produit'], ['storage', 'Conservation']);
    if (hasReviews) out.push(['reviews', 'Avis']);
    return out;
  }, [sheet, hasReviews]);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nav}>
      {items.map(([id, label]) => (
        <Pressable key={id} onPress={() => onGo(id)} accessibilityRole="link" style={styles.navChip}>
          <Text variant="small" style={styles.navText}>{label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function Bullets({ items, kind = 'tick' }: { items: string[]; kind?: 'tick' | 'dot' }) {
  return (
    <View style={styles.list}>
      {items.map((t, i) => (
        <View key={i} style={styles.li}>
          <Text color="goldText" style={styles.bullet}>{kind === 'tick' ? '✓' : '•'}</Text>
          <Text style={styles.liText}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

function SheetSections({ sheet, mark }: { sheet: ProductSheet; mark: (id: SectionId) => (e: { nativeEvent: { layout: { y: number } } }) => void }) {
  return (
    <>
      {sheet.benefits.length ? (
        <SectionCard title={sheet.benefits_title} icon={ICONS.heart} onLayout={mark('benefits')}>
          <Bullets items={sheet.benefits} />
          {sheet.benefits_note ? <Text variant="caption" color="muted">{sheet.benefits_note}</Text> : null}
        </SectionCard>
      ) : null}

      {sheet.recipes.length ? (
        <SectionCard title="Idées de recettes" icon={ICONS.spoon} onLayout={mark('recipes')}>
          {sheet.recipes.map((r, i) => (
            <View key={i} style={styles.recipe}>
              <View style={styles.recipeNum}><Text variant="small" color="white" style={styles.bold}>{i + 1}</Text></View>
              <View style={styles.recipeBody}>
                <Text variant="bodyStrong">{r.title}</Text>
                {r.body ? <Text color="ink2">{r.body}</Text> : null}
              </View>
            </View>
          ))}
        </SectionCard>
      ) : null}

      <SectionCard title="Détail du produit" icon={ICONS.list} onLayout={mark('detail')}>
        {sheet.details.map((d, i) => (
          <View key={i} style={[styles.spec, i > 0 && styles.specBorder]}>
            <Text variant="small" color="muted" style={styles.specLabel}>{d.label}</Text>
            <Text variant="small" style={styles.specValue}>{d.value}</Text>
          </View>
        ))}
        <Text variant="bodyStrong" style={styles.nutriTitle}>Valeurs nutritionnelles</Text>
        {sheet.nutrition ? (
          <>
            <View style={styles.table} accessibilityRole="summary">
              <View style={[styles.tr, styles.thead]}>
                <Text variant="caption" style={styles.tdLabel}> </Text>
                <Text variant="caption" style={styles.th}>100 g</Text>
                <Text variant="caption" style={styles.th}>Portion 30 g</Text>
              </View>
              {sheet.nutrition.rows.map((r) => (
                <View key={r.key} style={[styles.tr, r.key === 'energy' && styles.trEnergy]}>
                  <Text variant="small" style={[styles.tdLabel, r.sub && styles.sub]}>{r.label}</Text>
                  <Text variant="small" style={styles.td}>{r.per_100g}</Text>
                  <Text variant="small" style={styles.td}>{r.per_portion}</Text>
                </View>
              ))}
            </View>
            {sheet.nutrition.note ? <Text variant="caption" color="muted">{sheet.nutrition.note}</Text> : null}
          </>
        ) : (
          <Text variant="small" color="muted">Les valeurs nutritionnelles figurent sur l’étiquette du produit.</Text>
        )}
      </SectionCard>

      <SectionCard title="Conservation et recyclage" icon={ICONS.recycle} onLayout={mark('storage')}>
        {sheet.storage.length ? (
          <View style={styles.block}>
            <Text variant="bodyStrong">Bien conserver</Text>
            <Bullets items={sheet.storage} kind="dot" />
          </View>
        ) : null}
        {sheet.recycling.length ? (
          <View style={styles.block}>
            <Text variant="bodyStrong">Trier et recycler</Text>
            <Bullets items={sheet.recycling} kind="dot" />
          </View>
        ) : null}
      </SectionCard>
    </>
  );
}

function ReviewsSection({ block, loading }: { block?: ReviewsBlock; loading: boolean }) {
  if (loading || !block) return null;
  return (
    <SectionCard title="Avis clients" icon={ICONS.star}>
      {block.count > 0 ? (
        <View style={styles.ratingRow}>
          <Stars value={block.average} size={20} />
          <Text variant="bodyStrong">{block.average.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}/5</Text>
          <Text variant="small" color="muted">{block.count} avis</Text>
        </View>
      ) : (
        <Text color="muted">Aucun avis pour le moment. Après votre commande, vous recevrez une invitation à donner le vôtre.</Text>
      )}
      {block.items.map((r) => <ReviewCard key={r.id} review={r} />)}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  content: { backgroundColor: colors.cream, paddingBottom: spacing.xxl },
  body: { padding: spacing.md, gap: spacing.md },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.sm },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.lineStrong },
  dotActive: { width: 20, backgroundColor: colors.gold2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  buy: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: spacing.md, gap: spacing.sm + 2 },
  price: { fontSize: 30, lineHeight: 36 },
  block: { gap: spacing.sm },
  buyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  addBtn: { flex: 1 },
  added: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addedText: { fontWeight: '700' },
  nav: { gap: spacing.sm },
  navChip: { minHeight: 36, paddingHorizontal: spacing.md, justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.champagne, borderWidth: 1, borderColor: colors.line },
  navText: { fontWeight: '600', color: colors.goldText },
  desc: { gap: spacing.sm },
  kicker: { color: colors.goldText, letterSpacing: 1.5 },
  lead: { fontSize: 19, lineHeight: 27, fontWeight: '600', color: colors.ink },
  list: { gap: spacing.sm },
  li: { flexDirection: 'row', gap: spacing.sm },
  bullet: { width: 16, fontWeight: '700' },
  liText: { flex: 1 },
  bold: { fontWeight: '700' },
  recipe: { flexDirection: 'row', gap: spacing.sm + 2 },
  recipeNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.gold2, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  recipeBody: { flex: 1, gap: 2 },
  spec: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
  specBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  specLabel: { width: 110, fontWeight: '600' },
  specValue: { flex: 1 },
  nutriTitle: { marginTop: spacing.sm },
  table: { borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  tr: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  thead: { backgroundColor: colors.champagne, borderTopWidth: 0 },
  trEnergy: { backgroundColor: colors.cream },
  th: { flex: 1, textAlign: 'right', fontWeight: '700', color: colors.ink2 },
  tdLabel: { flex: 1.4, color: colors.ink },
  td: { flex: 1, textAlign: 'right' },
  sub: { paddingLeft: spacing.md, color: colors.muted },
});

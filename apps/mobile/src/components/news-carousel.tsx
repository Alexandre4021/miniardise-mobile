import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import type { Slide } from '@/api/mobile/home';
import { Text } from '@/components/text';
import { categoriesQuery } from '@/features/catalog/queries';
import { homeQuery } from '@/features/home/queries';
import { colors, radius, spacing } from '@/theme/tokens';
import { resolveSiteLink } from '@/utils/site-link';

const GUTTER = spacing.md;

/**
 * Carrousel d'actualité, alimenté par l'extension « MiniarDise Carrousel » du site.
 * Masqué s'il n'y a aucune photo. Défilement automatique coupé si l'utilisateur a demandé
 * à réduire les animations, ou dès qu'il fait défiler à la main.
 */
export function NewsCarousel() {
  const { data } = useQuery(homeQuery());
  const categories = useQuery(categoriesQuery()).data;
  const { width: screen } = useWindowDimensions();
  const width = screen - GUTTER * 2;
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined);
  }, []);

  const slides = data?.carousel.slides ?? [];
  const settings = data?.carousel.settings;
  const ratio = settings?.frame_ratio ?? 1.5;
  const height = Math.round(width / ratio);

  useEffect(() => {
    if (!settings?.autoplay || paused || reduceMotion || slides.length < 2) return;
    const t = setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % slides.length;
        listRef.current?.scrollToOffset({ offset: next * width, animated: true });
        return next;
      });
    }, settings.speed_ms);
    return () => clearInterval(t);
  }, [settings, paused, reduceMotion, slides.length, width]);

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width)),
    [width],
  );

  const open = useCallback(
    (slide: Slide) => {
      const target = resolveSiteLink(slide.link);
      if (target.type === 'product') router.push({ pathname: '/produit/[id]', params: { id: target.slug } });
      else if (target.type === 'category') {
        const cat = categories?.find((c) => c.slug === target.slug);
        router.navigate({ pathname: '/boutique', params: cat ? { categorie: String(cat.id) } : {} });
      } else if (target.type === 'web') void WebBrowser.openBrowserAsync(target.url);
      else router.navigate('/boutique');
    },
    [categories],
  );

  if (!slides.length) return null;

  return (
    <View style={styles.wrap}>
      <Text variant="title">À la une</Text>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(s) => String(s.id)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => setPaused(true)}
        onMomentumScrollEnd={onMomentumEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        style={[styles.frame, { width, height }]}
        renderItem={({ item, index: i }) => (
          <Pressable
            onPress={() => open(item)}
            accessibilityRole="link"
            accessibilityLabel={item.alt || `Actualité ${i + 1} sur ${slides.length}`}
            style={{ width, height }}>
            <Image
              source={{ uri: item.image }}
              style={StyleSheet.absoluteFill}
              contentFit={item.fit}
              transition={200}
              alt={item.alt}
            />
            {item.badge ? (
              <View style={styles.badge}>
                <Text variant="caption" color="white" style={styles.badgeText}>{item.badge}</Text>
              </View>
            ) : null}
          </Pressable>
        )}
      />
      {slides.length > 1 ? (
        <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {slides.map((s, i) => (
            <View key={s.id} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  frame: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.champagne, // fond uni champagne, comme le réglage « uni » du site
    borderWidth: 1,
    borderColor: colors.line,
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
  },
  badgeText: { letterSpacing: 0.6, textTransform: 'uppercase' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.lineStrong },
  dotActive: { width: 20, backgroundColor: colors.gold2 },
});

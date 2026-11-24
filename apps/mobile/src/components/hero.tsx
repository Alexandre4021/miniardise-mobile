import { LOGO } from '@/theme/assets';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { BRAND_NAME, BRAND_TAGLINE } from '@/theme/brand';
import { colors, radius, spacing, tapTarget } from '@/theme/tokens';

/** Bandeau d'accueil : dégradé crème → sable du site, logo, accroche et appel à l'action. */
export function Hero({ onShop }: { onShop: () => void }) {
  return (
    <LinearGradient
      colors={['#FFFAF0', '#F8EED6', '#F1E2BD']}
      start={{ x: 0.85, y: 0 }}
      end={{ x: 0.15, y: 1 }}
      style={styles.hero}>
      <View style={styles.glow} pointerEvents="none" />
      <Image
        source={LOGO}
        style={styles.logo}
        contentFit="contain"
        accessibilityLabel={`Logo ${BRAND_NAME}`}
      />
      <Text variant="caption" style={styles.kicker}>DEPUIS 2020 · CORMEILLES-EN-PARISIS</Text>
      <Text style={styles.title} accessibilityRole="header">{BRAND_NAME}</Text>
      <Text color="ink2" style={styles.tagline}>{BRAND_TAGLINE}</Text>
      <Pressable
        onPress={onShop}
        accessibilityRole="button"
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
        <Text variant="bodyStrong" color="white">Découvrir la boutique</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radius.md,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    right: -120,
    bottom: -160,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(214,175,85,0.18)',
  },
  logo: { width: 132, height: 132, marginBottom: spacing.xs },
  kicker: { color: colors.goldText, letterSpacing: 1.5 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '700', color: colors.goldText, textAlign: 'center' },
  tagline: { textAlign: 'center', maxWidth: 320 },
  cta: {
    marginTop: spacing.sm,
    minHeight: tapTarget + 4,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPressed: { backgroundColor: colors.ink2 },
});

import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/button';

import { Text } from '@/components/text';
import { BRAND_TAGLINE, HERO_TITLE } from '@/theme/brand';
import { colors, radius, spacing } from '@/theme/tokens';

/** Bandeau d'accueil : dégradé crème → sable du site, accroche et appel à l'action (logo et nom : AppHeader). */
export function Hero({ onShop }: { onShop: () => void }) {
  return (
    <LinearGradient
      colors={['#FFFAF0', '#F8EED6', '#F1E2BD']}
      start={{ x: 0.85, y: 0 }}
      end={{ x: 0.15, y: 1 }}
      style={styles.hero}>
      <View style={styles.glow} pointerEvents="none" />
      <Text variant="caption" style={styles.kicker}>DEPUIS 2020</Text>
      <Text style={styles.title} accessibilityRole="header">{HERO_TITLE}</Text>
      <Text color="ink2" style={styles.tagline}>{BRAND_TAGLINE}</Text>
      <Button title="Découvrir la boutique" onPress={onShop} style={styles.cta} />
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
  kicker: { color: colors.goldText, letterSpacing: 1.5 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '700', color: colors.goldText, textAlign: 'center' },
  tagline: { textAlign: 'center', maxWidth: 320 },
  cta: { marginTop: spacing.sm, paddingHorizontal: spacing.xl },
});

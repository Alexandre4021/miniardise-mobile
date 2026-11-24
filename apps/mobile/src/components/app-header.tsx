import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { LOGO } from '@/theme/assets';
import { BRAND_NAME } from '@/theme/brand';
import { colors, spacing } from '@/theme/tokens';

/** En-tête des onglets : logo + nom, centrés. */
export function AppHeader() {
  return (
    <View style={styles.bar} accessibilityRole="header" accessibilityLabel={BRAND_NAME}>
      <Image source={LOGO} style={styles.logo} contentFit="contain" alt="" />
      <Text style={styles.name} numberOfLines={1}>{BRAND_NAME}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cream,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  logo: { width: 40, height: 40 },
  name: { flexShrink: 1, fontSize: 19, lineHeight: 24, fontWeight: '700', color: colors.goldText, letterSpacing: 0.2 },
});

import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { LOGO } from '@/theme/assets';
import { BRAND_NAME } from '@/theme/brand';
import { colors, spacing } from '@/theme/tokens';

/** En-tête des onglets : logo + nom de la boutique sur une ligne. */
export function AppHeader({ right }: { right?: React.ReactNode }) {
  return (
    <View style={styles.bar} accessibilityRole="header">
      <Image source={LOGO} style={styles.logo} contentFit="contain" accessibilityIgnoresInvertColors alt="" />
      <Text style={styles.name} numberOfLines={1}>{BRAND_NAME}</Text>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cream,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  logo: { width: 40, height: 40 },
  name: { flex: 1, fontSize: 19, lineHeight: 24, fontWeight: '700', color: colors.goldText, letterSpacing: 0.2 },
});

import { StyleSheet, View, type ViewProps } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { Text } from '@/components/text';
import { colors, radius, spacing } from '@/theme/tokens';

/** Carte de section de la fiche produit (style « mo-sheet__card » du site). */
export function SectionCard({ title, icon, children, ...rest }: ViewProps & { title: string; icon?: string }) {
  return (
    <View style={styles.card} {...rest}>
      <View style={styles.head}>
        {icon ? (
          <View style={styles.ico}>
            <SvgXml
              xml={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>`}
              color={colors.goldText}
              width={20}
              height={20}
            />
          </View>
        ) : null}
        <Text variant="title" accessibilityRole="header" style={styles.title}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export const ICONS = {
  text: '<path d="M5 6h14M5 10h14M5 14h10M5 18h7"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  spoon: '<path d="M8 3c-2 0-3.5 2.2-3.5 4.6S6 11.5 8 11.5s3.5-1.6 3.5-3.9S10 3 8 3zM8 11.5V21M16 3v6.5a2 2 0 0 0 2 2V21M16 3h2M20 3v6.5"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  recycle: '<path d="M7 19H4.5a1.5 1.5 0 0 1-1.3-2.2L6 12M17 19h2.5a1.5 1.5 0 0 0 1.3-2.2L18 12M9 5.5l1.7-2.8a1.5 1.5 0 0 1 2.6 0L16 7M9 19h6"/>',
  star: '<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8-4.3-4.1 5.9-.9z"/>',
};

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: spacing.md, gap: spacing.sm + 2 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ico: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.champagne, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1 },
});

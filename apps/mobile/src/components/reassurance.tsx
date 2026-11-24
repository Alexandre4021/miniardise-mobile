import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { Text } from '@/components/text';
import { colors, radius, spacing } from '@/theme/tokens';

// Pictogrammes du thème (inc/icons.php, 24x24).
const ICON = {
  quality: '<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8-4.3-4.1 5.9-.9z"/>',
  shield: '<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.4-7.5 9.5-4.3-1.1-7.5-4.9-7.5-9.5V6L12 3z"/><path d="M8.8 12.2l2.2 2.2 4.4-4.6"/>',
  truck: '<path d="M3 6.5h11v9H3zM14 9.5h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>',
};
const svg = (inner: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

const ITEMS = [
  { icon: ICON.quality, title: 'Qualité premium', text: 'Fruits secs sélectionnés toute l’année' },
  { icon: ICON.shield, title: 'Paiement sécurisé', text: 'Carte bancaire, Apple Pay, Google Pay' },
  { icon: ICON.truck, title: 'Livraison', text: 'Colissimo, Chronopost, point relais ou retrait' },
];

export function Reassurance() {
  return (
    <View style={styles.box}>
      {ITEMS.map((i) => (
        <View key={i.title} style={styles.item}>
          <View style={styles.iconWrap}>
            <SvgXml xml={svg(i.icon)} color={colors.goldText} width={22} height={22} />
          </View>
          <View style={styles.text}>
            <Text variant="small" style={styles.title}>{i.title}</Text>
            <Text variant="caption" color="muted">{i.text}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4, paddingVertical: spacing.sm },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.champagne, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
  title: { fontWeight: '700', color: colors.ink },
});

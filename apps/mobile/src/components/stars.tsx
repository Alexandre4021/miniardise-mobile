import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { colors } from '@/theme/tokens';

const STAR = 'M12 2.8l2.8 5.7 6.3.9-4.6 4.4 1.1 6.2L12 17.1 6.4 20l1.1-6.2L2.9 9.4l6.3-.9z';

/** Note sur 5, demi-étoiles comprises (comme les étoiles des avis du site). */
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const v = Math.max(0, Math.min(5, value));
  return (
    <View style={styles.row} accessible accessibilityLabel={`Note : ${v.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} sur 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, v - i));
        const xml = `<svg viewBox="0 0 24 24"><defs><linearGradient id="g${i}"><stop offset="${fill}" stop-color="${colors.gold}"/><stop offset="${fill}" stop-color="${colors.line}"/></linearGradient></defs><path d="${STAR}" fill="url(#g${i})" stroke="${colors.gold2}" stroke-width="1"/></svg>`;
        return <SvgXml key={i} xml={xml} width={size} height={size} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 2 } });

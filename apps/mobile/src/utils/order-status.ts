import { colors } from '@/theme/tokens';

/**
 * Couleur d'un statut de commande WooCommerce (le libellé vient toujours du site,
 * y compris les statuts personnalisés comme « Expédiée » ou « En cours de livraison »).
 */
export function statusTone(status: string): { bg: string; text: string } {
  const s = status.replace(/^wc-/, '');
  if (['completed', 'sended', 'shipped', 'being-delivered'].includes(s)) return { bg: '#E3F0DA', text: colors.success };
  if (['processing', 'on-hold'].includes(s)) return { bg: colors.champagne, text: colors.goldText };
  if (['cancelled', 'failed', 'refunded'].includes(s)) return { bg: '#F6DEDB', text: colors.error };
  return { bg: colors.sand, text: colors.ink2 }; // pending et autres
}

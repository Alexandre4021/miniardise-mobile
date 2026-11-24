import type { Prices } from '@/api/store/schemas';

/**
 * Formate un montant Store API (unités mineures) avec les réglages de la boutique.
 * Implémentation sans Intl pour un rendu identique sur iOS, Android et dans les tests.
 */
export function formatAmount(minor: string, p: Pick<Prices, 'currency_minor_unit' | 'currency_decimal_separator' | 'currency_thousand_separator' | 'currency_prefix' | 'currency_suffix'>): string {
  const negative = minor.startsWith('-');
  const digits = (negative ? minor.slice(1) : minor).padStart(p.currency_minor_unit + 1, '0');
  const cut = digits.length - p.currency_minor_unit;
  const intPart = digits.slice(0, cut).replace(/\B(?=(\d{3})+(?!\d))/g, p.currency_thousand_separator);
  const decPart = p.currency_minor_unit > 0 ? p.currency_decimal_separator + digits.slice(cut) : '';
  const suffix = p.currency_suffix.replace(/^ /, ' '); // espace insécable avant « € »
  return `${negative ? '-' : ''}${p.currency_prefix}${intPart}${decPart}${suffix}`;
}

/** Libellé de prix d'une fiche : « 4,90 € » ou « dès 4,90 € » pour une fourchette. */
export function priceLabel(p: Prices): string {
  if (p.price_range && p.price_range.min_amount !== p.price_range.max_amount) {
    return `dès ${formatAmount(p.price_range.min_amount, p)}`;
  }
  return formatAmount(p.price, p);
}

import { formatAmount } from '@/utils/format-price';

/** Format euros pour les montants de l'extension (centimes, entier). */
export const EUR = {
  currency_minor_unit: 2,
  currency_decimal_separator: ',',
  currency_thousand_separator: ' ',
  currency_prefix: '',
  currency_suffix: ' €',
};

export const euros = (minor: number) => formatAmount(String(minor), EUR);

/** Somme de deux montants Store API (chaînes en centimes). */
export const addMinor = (a: string | null | undefined, b: string | null | undefined) => String(Number(a ?? 0) + Number(b ?? 0));

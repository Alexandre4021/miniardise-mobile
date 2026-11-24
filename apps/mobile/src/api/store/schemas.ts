import { z } from 'zod';

/**
 * Schémas de la WooCommerce Store API (wc/store/v1), limités aux champs utilisés par l'app.
 * Les champs inconnus sont ignorés : une évolution de WooCommerce n'empêche pas l'affichage.
 * Montants : chaînes en unités mineures (centimes), à formater avec currency_minor_unit.
 */
const amount = z.string().regex(/^-?\d+$/);

export const pricesSchema = z.object({
  price: amount,
  regular_price: amount,
  sale_price: amount,
  price_range: z.object({ min_amount: amount, max_amount: amount }).nullable(),
  currency_code: z.string(),
  currency_minor_unit: z.number().int().min(0).max(4),
  currency_decimal_separator: z.string(),
  currency_thousand_separator: z.string(),
  currency_prefix: z.string(),
  currency_suffix: z.string(),
});

export const imageSchema = z.object({
  id: z.number(),
  src: z.url(),
  thumbnail: z.url(),
  alt: z.string(),
  name: z.string(),
});

export const productSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  slug: z.string(),
  type: z.enum(['simple', 'variable', 'grouped', 'external', 'variation']),
  permalink: z.url(),
  short_description: z.string(),
  description: z.string(),
  on_sale: z.boolean(),
  prices: pricesSchema,
  images: z.array(imageSchema),
  categories: z.array(z.object({ id: z.number(), name: z.string(), slug: z.string() })),
  attributes: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      taxonomy: z.string().nullable(),
      has_variations: z.boolean(),
      terms: z.array(z.object({ id: z.number(), name: z.string(), slug: z.string() })),
    }),
  ),
  variations: z.array(
    z.object({ id: z.number(), attributes: z.array(z.object({ name: z.string(), value: z.string() })) }),
  ),
  is_purchasable: z.boolean(),
  is_in_stock: z.boolean(),
  low_stock_remaining: z.number().nullable(),
});

export const productListSchema = z.array(productSchema);

export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  parent: z.number(),
  count: z.number(),
  image: z.object({ src: z.url(), thumbnail: z.url().optional(), alt: z.string() }).nullable(),
});
export const categoryListSchema = z.array(categorySchema);

export type Product = z.infer<typeof productSchema>;
export type Prices = z.infer<typeof pricesSchema>;
export type Category = z.infer<typeof categorySchema>;

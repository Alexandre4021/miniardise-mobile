import { z } from 'zod';

import { apiRequest } from '@/api/client';

const CART = '/wp-json/wc/store/v1/cart';
const amount = z.string().regex(/^-?\d+$/);

const currency = {
  currency_code: z.string(),
  currency_minor_unit: z.number(),
  currency_decimal_separator: z.string(),
  currency_thousand_separator: z.string(),
  currency_prefix: z.string(),
  currency_suffix: z.string(),
};

export const cartItemSchema = z.object({
  key: z.string(),
  id: z.number(),
  quantity: z.number(),
  name: z.string(),
  images: z.array(z.object({ thumbnail: z.string(), alt: z.string() })),
  variation: z.array(z.object({ attribute: z.string(), value: z.string() })),
  quantity_limits: z.object({ minimum: z.number(), maximum: z.number(), multiple_of: z.number(), editable: z.boolean() }),
  totals: z.object({ line_subtotal: amount, line_subtotal_tax: amount, line_total: amount, line_total_tax: amount, ...currency }),
});

export const shippingRateSchema = z.object({
  rate_id: z.string(),
  name: z.string(),
  description: z.string().optional().default(''),
  delivery_time: z.string().optional().default(''),
  price: amount,
  taxes: amount.optional().default('0'),
  method_id: z.string(),
  selected: z.boolean(),
  ...currency,
});

export const cartSchema = z.object({
  items: z.array(cartItemSchema),
  items_count: z.number(),
  coupons: z.array(z.object({ code: z.string(), totals: z.object({ total_discount: amount, total_discount_tax: amount, ...currency }) })),
  needs_shipping: z.boolean(),
  shipping_address: z.object({ postcode: z.string(), city: z.string(), country: z.string() }).partial(),
  shipping_rates: z.array(z.object({ package_id: z.union([z.number(), z.string()]), name: z.string(), shipping_rates: z.array(shippingRateSchema) })),
  totals: z.object({
    total_items: amount,
    total_items_tax: amount,
    total_shipping: amount.nullable(),
    total_shipping_tax: amount.nullable(),
    total_discount: amount,
    total_discount_tax: amount,
    total_tax: amount,
    total_price: amount,
    ...currency,
  }),
  errors: z.array(z.object({ code: z.string(), message: z.string() })).optional().default([]),
});

export type Cart = z.infer<typeof cartSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type ShippingRate = z.infer<typeof shippingRateSchema>;

const call = async (method: 'GET' | 'POST', path: string, body?: unknown, signal?: AbortSignal) =>
  (await apiRequest({ method, path: `${CART}${path}`, schema: cartSchema, body, cart: true, auth: 'optional', signal })).data;

export const fetchCart = (signal?: AbortSignal) => call('GET', '', undefined, signal);
export const addToCart = (id: number, quantity: number) => call('POST', '/add-item', { id, quantity });
export const updateCartItem = (key: string, quantity: number) => call('POST', '/update-item', { key, quantity });
export const removeCartItem = (key: string) => call('POST', '/remove-item', { key });
export const applyCoupon = (code: string) => call('POST', '/apply-coupon', { code });
export const removeCoupon = (code: string) => call('POST', '/remove-coupon', { code });
export const updateShippingDestination = (a: { postcode: string; city: string; country: string }) =>
  call('POST', '/update-customer', { shipping_address: a });
export const selectShippingRate = (packageId: number | string, rateId: string) =>
  call('POST', '/select-shipping-rate', { package_id: packageId, rate_id: rateId });

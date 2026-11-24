import { z } from 'zod';

import { apiRequest } from '@/api/client';
import { userSchema } from '@/api/mobile/auth';

const NS = '/wp-json/miniardise-mobile/v1';

export const addressSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  company: z.string(),
  address_1: z.string(),
  address_2: z.string(),
  postcode: z.string(),
  city: z.string(),
  country: z.string(),
  phone: z.string(),
});
export const addressesSchema = z.object({
  billing: addressSchema.extend({ email: z.string() }),
  shipping: addressSchema,
});
export type Address = z.infer<typeof addressSchema>;
export type Addresses = z.infer<typeof addressesSchema>;

export const orderSummarySchema = z.object({
  id: z.number(),
  number: z.string(),
  date: z.string(),
  status: z.string(),
  status_label: z.string(),
  total: z.number(),
  currency: z.string(),
  item_count: z.number(),
});
export const orderDetailSchema = orderSummarySchema.extend({
  items: z.array(z.object({ name: z.string(), quantity: z.number(), total: z.number(), product_id: z.number(), image: z.string() })),
  subtotal: z.number(),
  shipping_total: z.number(),
  discount_total: z.number(),
  tax_total: z.number(),
  shipping_methods: z.array(z.string()),
  payment_method: z.string(),
  shipping_address: z.array(z.string()),
  billing_address: z.array(z.string()),
  needs_payment: z.boolean(),
});
export type OrderSummary = z.infer<typeof orderSummarySchema>;
export type OrderDetail = z.infer<typeof orderDetailSchema>;

export const fetchMe = async (signal?: AbortSignal) =>
  (await apiRequest({ path: `${NS}/me`, schema: userSchema, auth: 'required', signal })).data;

export const updateMe = async (input: { first_name?: string; last_name?: string; phone?: string }) =>
  (await apiRequest({ method: 'PATCH', path: `${NS}/me`, schema: userSchema, auth: 'required', body: input })).data;

export const fetchAddresses = async (signal?: AbortSignal) =>
  (await apiRequest({ path: `${NS}/me/addresses`, schema: addressesSchema, auth: 'required', signal })).data;

export const updateAddresses = async (input: Partial<{ billing: Partial<Address>; shipping: Partial<Address> }>) =>
  (await apiRequest({ method: 'PUT', path: `${NS}/me/addresses`, schema: addressesSchema, auth: 'required', body: input })).data;

export const fetchOrders = async (page: number, signal?: AbortSignal) =>
  (
    await apiRequest({
      path: `${NS}/me/orders`,
      query: { page },
      schema: z.object({ page: z.number(), total_pages: z.number(), orders: z.array(orderSummarySchema) }),
      auth: 'required',
      signal,
    })
  ).data;

export const fetchOrder = async (id: number, signal?: AbortSignal) =>
  (await apiRequest({ path: `${NS}/me/orders/${id}`, schema: orderDetailSchema, auth: 'required', signal })).data;

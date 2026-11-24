import { z } from 'zod';

import { apiRequest } from '@/api/client';
import { variationSchema, type Variation } from '@/api/store/schemas';

export type { Variation };

const NS = '/wp-json/miniardise-mobile/v1';

export const reviewSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  product_name: z.string(),
  author: z.string(),
  rating: z.number().min(0).max(5),
  text: z.string(),
  date: z.string(),
  verified: z.boolean(),
  photo: z.string(),
});
export const reviewsBlockSchema = z.object({ count: z.number(), average: z.number(), items: z.array(reviewSchema) });

const nutritionRow = z.object({ key: z.string(), label: z.string(), sub: z.boolean(), per_100g: z.string(), per_portion: z.string() });

export const sheetSchema = z.object({
  lead: z.string(),
  text: z.string(),
  benefits_title: z.string(),
  benefits: z.array(z.string()),
  benefits_note: z.string(),
  recipes: z.array(z.object({ title: z.string(), body: z.string() })),
  details: z.array(z.object({ label: z.string(), value: z.string() })),
  nutrition: z.object({ rows: z.array(nutritionRow), note: z.string() }).nullable(),
  storage: z.array(z.string()),
  recycling: z.array(z.string()),
});


export const productDetailsSchema = z.object({
  id: z.number(),
  sheet: sheetSchema.nullable(),
  variations: z.array(variationSchema),
  reviews: reviewsBlockSchema,
});

export type Review = z.infer<typeof reviewSchema>;
export type ReviewsBlock = z.infer<typeof reviewsBlockSchema>;
export type ProductSheet = z.infer<typeof sheetSchema>;
export type ProductDetails = z.infer<typeof productDetailsSchema>;

export const fetchProductDetails = async (id: number, signal?: AbortSignal) =>
  (await apiRequest({ path: `${NS}/products/${id}/details`, schema: productDetailsSchema, signal })).data;

export const fetchLatestReviews = async (signal?: AbortSignal) =>
  (await apiRequest({ path: `${NS}/reviews/latest`, schema: reviewsBlockSchema, signal })).data;

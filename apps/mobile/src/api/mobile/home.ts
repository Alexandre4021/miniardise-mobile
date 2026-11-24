import { z } from 'zod';

import { apiGet } from '@/api/client';

export const slideSchema = z.object({
  id: z.number(),
  image: z.url(),
  width: z.number(),
  height: z.number(),
  alt: z.string(),
  badge: z.string(),
  link: z.string(),
  fit: z.enum(['contain', 'cover']),
});

export const homeSchema = z.object({
  carousel: z.object({
    slides: z.array(slideSchema),
    settings: z
      .object({
        autoplay: z.boolean(),
        speed_ms: z.number().int().min(2000).max(20000),
        frame_ratio: z.number().positive(),
        background: z.string(),
      })
      .nullable(),
  }),
});

export type Slide = z.infer<typeof slideSchema>;
export type HomeContent = z.infer<typeof homeSchema>;

export async function fetchHome(signal?: AbortSignal): Promise<HomeContent> {
  const { data } = await apiGet({ path: '/wp-json/miniardise-mobile/v1/home', schema: homeSchema, signal });
  return data;
}

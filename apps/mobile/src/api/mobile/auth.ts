import { z } from 'zod';

import { apiRequest } from '@/api/client';
import { ApiError } from '@/api/errors';
import { tokensSchema, type Tokens } from '@/features/auth/session';

const NS = '/wp-json/miniardise-mobile/v1';

export const userSchema = z.object({
  id: z.number(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string().optional().default(''),
});
export type User = z.infer<typeof userSchema>;

const authResponse = z.object({ tokens: tokensSchema, user: userSchema });

export async function login(input: { login: string; password: string; device: string }) {
  return (await apiRequest({ method: 'POST', path: `${NS}/auth/login`, schema: authResponse, body: input, timeoutMs: 30_000 })).data;
}

export async function register(input: { email: string; password: string; first_name: string; last_name: string; device: string }) {
  // La création d'un client WooCommerce est lente (e-mails, extensions) : délai étendu.
  return (await apiRequest({ method: 'POST', path: `${NS}/auth/register`, schema: authResponse, body: input, timeoutMs: 45_000 })).data;
}

/** null = refusé par le serveur (session terminée) ; exception = problème réseau. */
export async function refreshTokens(refreshToken: string): Promise<Tokens | null> {
  try {
    const r = await apiRequest({
      method: 'POST',
      path: `${NS}/auth/refresh`,
      schema: z.object({ tokens: tokensSchema }),
      body: { refresh_token: refreshToken },
    });
    return r.data.tokens;
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 400)) return null;
    throw e;
  }
}

export async function logout(all = false) {
  await apiRequest({ method: 'POST', path: `${NS}/auth/logout`, schema: z.object({ ok: z.boolean() }), body: { all }, auth: 'required' });
}

export async function requestPasswordReset(loginValue: string) {
  return (await apiRequest({ method: 'POST', path: `${NS}/auth/password-reset`, schema: z.object({ message: z.string() }), body: { login: loginValue } })).data;
}

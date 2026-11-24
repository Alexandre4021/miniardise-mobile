import { z } from 'zod';

import { apiRequest, configureClient } from '@/api/client';

const base = 'https://recette.epiceriefineminiardise.fr';
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

describe('apiRequest — session et panier', () => {
  it('jeton expiré côté serveur : renouvelle une fois puis rejoue la requête', async () => {
    let token = 'old';
    const refresh = jest.fn(async () => {
      token = 'new';
    });
    configureClient({ auth: { accessToken: async () => token, refresh } });
    const f = jest
      .fn()
      .mockResolvedValueOnce(json({ code: 'mm_invalid_token', message: 'Session expirée.' }, 401))
      .mockResolvedValueOnce(json({ ok: true }));
    const r = await apiRequest({ path: '/x', schema: z.object({ ok: z.boolean() }), auth: 'required', baseUrl: base, fetchImpl: f as unknown as typeof fetch });
    expect(r.data.ok).toBe(true);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect((f.mock.calls[1][1] as RequestInit).headers).toMatchObject({ Authorization: 'Bearer new' });
  });

  it('pas de boucle : un second 401 est remonté', async () => {
    configureClient({ auth: { accessToken: async () => 't', refresh: async () => undefined } });
    const f = jest.fn().mockResolvedValue(json({ code: 'mm_invalid_token', message: 'x' }, 401));
    await expect(
      apiRequest({ path: '/x', schema: z.object({}), auth: 'required', baseUrl: base, fetchImpl: f as unknown as typeof fetch }),
    ).rejects.toMatchObject({ code: 'unauthorized' });
    expect(f).toHaveBeenCalledTimes(2);
  });

  it('auth requise sans session : refus local, aucune requête', async () => {
    configureClient({ auth: { accessToken: async () => null, refresh: async () => undefined } });
    const f = jest.fn();
    await expect(
      apiRequest({ path: '/x', schema: z.object({}), auth: 'required', baseUrl: base, fetchImpl: f as unknown as typeof fetch }),
    ).rejects.toMatchObject({ code: 'unauthorized' });
    expect(f).not.toHaveBeenCalled();
  });

  it('panier : envoie et mémorise Cart-Token / Nonce', async () => {
    const stored = { cartToken: 'ct-1' as string | null, nonce: null as string | null };
    configureClient({
      cart: { get: async () => ({ ...stored }), set: async (c, n) => void Object.assign(stored, { cartToken: c ?? stored.cartToken, nonce: n ?? stored.nonce }) },
    });
    const f = jest.fn().mockResolvedValue(json({}, 200, { 'cart-token': 'ct-2', nonce: 'n-2' }));
    await apiRequest({ method: 'POST', path: '/cart/add-item', body: { id: 1 }, schema: z.object({}), cart: true, baseUrl: base, fetchImpl: f as unknown as typeof fetch });
    expect((f.mock.calls[0][1] as RequestInit).headers).toMatchObject({ 'Cart-Token': 'ct-1', 'Content-Type': 'application/json' });
    expect(stored).toEqual({ cartToken: 'ct-2', nonce: 'n-2' });
  });

  it('message métier de WooCommerce conservé (ex. code promo invalide)', async () => {
    const f = jest.fn().mockResolvedValue(json({ code: 'woocommerce_rest_cart_coupon_error', message: 'Le code promo « X » n’existe pas !' }, 400));
    await expect(
      apiRequest({ method: 'POST', path: '/c', schema: z.object({}), baseUrl: base, fetchImpl: f as unknown as typeof fetch }),
    ).rejects.toMatchObject({ serverMessage: 'Le code promo « X » n’existe pas !' });
  });
});

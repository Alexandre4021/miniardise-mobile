import { z } from 'zod';

import { apiGet, buildUrl } from '@/api/client';
import { ApiError } from '@/api/errors';

const base = 'https://recette.epiceriefineminiardise.fr';
const schema = z.array(z.object({ id: z.number() }));

function fakeFetch(body: unknown, init: { status?: number; type?: string } = {}) {
  return jest.fn(async () =>
    new Response(typeof body === 'string' ? body : JSON.stringify(body), {
      status: init.status ?? 200,
      headers: { 'content-type': init.type ?? 'application/json; charset=UTF-8', 'x-wp-totalpages': '3' },
    }),
  ) as unknown as typeof fetch;
}

describe('apiGet', () => {
  it('construit l’URL sans paramètres vides', () => {
    expect(buildUrl(base, '/wp-json/wc/store/v1/products', { page: 1, search: '', category: undefined })).toBe(
      `${base}/wp-json/wc/store/v1/products?page=1`,
    );
  });

  it('renvoie les données validées et les en-têtes', async () => {
    const r = await apiGet({ path: '/x', schema, baseUrl: base, fetchImpl: fakeFetch([{ id: 1 }]) });
    expect(r.data).toEqual([{ id: 1 }]);
    expect(r.headers.get('x-wp-totalpages')).toBe('3');
  });

  it('détecte une page anti-robots HTML', async () => {
    const p = apiGet({ path: '/x', schema, baseUrl: base, fetchImpl: fakeFetch('<html>Anubis</html>', { type: 'text/html' }) });
    await expect(p).rejects.toMatchObject({ code: 'blocked' });
  });

  it('refuse une réponse au mauvais format', async () => {
    const p = apiGet({ path: '/x', schema, baseUrl: base, fetchImpl: fakeFetch([{ id: 'a' }]) });
    await expect(p).rejects.toMatchObject({ code: 'invalid_response' });
  });

  it.each([
    [404, 'not_found'],
    [406, 'blocked'],
    [429, 'rate_limited'],
    [503, 'server'],
  ])('HTTP %i → %s', async (status, code) => {
    const p = apiGet({ path: '/x', schema, baseUrl: base, fetchImpl: fakeFetch({}, { status }) });
    await expect(p).rejects.toMatchObject({ code });
  });

  it('erreur réseau → network', async () => {
    const failing = jest.fn(async () => {
      throw new TypeError('Network request failed');
    }) as unknown as typeof fetch;
    await expect(apiGet({ path: '/x', schema, baseUrl: base, fetchImpl: failing })).rejects.toBeInstanceOf(ApiError);
  });
});

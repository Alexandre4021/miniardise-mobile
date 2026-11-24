import { SessionManager, type Tokens } from '@/features/auth/session';
import type { KeyValueStore } from '@/lib/secure-storage';

const hex = (c: string) => c.repeat(64);
const tokens = (c: string, now: number, accessTtl = 900): Tokens => ({
  access_token: hex(c),
  access_expires_at: now + accessTtl,
  refresh_token: hex(c === 'a' ? 'b' : 'd'),
  refresh_expires_at: now + 30 * 86400,
  token_type: 'Bearer',
});

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, get: async (k) => data.get(k) ?? null, set: async (k, v) => void data.set(k, v), remove: async (k) => void data.delete(k) };
}

describe('SessionManager', () => {
  let now = 1_800_000_000;
  const clock = () => now;

  it('sans session : pas de jeton', async () => {
    const s = new SessionManager(memoryStore(), clock);
    expect(await s.load()).toBe(false);
    expect(await s.accessToken()).toBeNull();
  });

  it('jeton valide renvoyé sans appel réseau, et persisté chiffré côté système', async () => {
    const store = memoryStore();
    const s = new SessionManager(store, clock);
    const refresher = jest.fn();
    s.setRefresher(refresher);
    await s.save(tokens('a', now));
    expect(await s.accessToken()).toBe(hex('a'));
    expect(refresher).not.toHaveBeenCalled();
    expect(store.data.size).toBe(1);
  });

  it('renouvelle avant expiration, une seule requête même avec 3 appels simultanés', async () => {
    const s = new SessionManager(memoryStore(), clock);
    await s.save(tokens('a', now, 30)); // expire dans 30 s (< 60 s de marge)
    const refresher = jest.fn(async () => tokens('c', now));
    s.setRefresher(refresher);
    const results = await Promise.all([s.accessToken(), s.accessToken(), s.accessToken()]);
    expect(refresher).toHaveBeenCalledTimes(1);
    expect(results).toEqual([hex('c'), hex('c'), hex('c')]);
  });

  it('renouvellement refusé par le serveur : session effacée et écouteurs prévenus', async () => {
    const s = new SessionManager(memoryStore(), clock);
    await s.save(tokens('a', now, 10));
    s.setRefresher(async () => null);
    const listener = jest.fn();
    s.onChange(listener);
    expect(await s.accessToken()).toBeNull();
    expect(listener).toHaveBeenCalledWith(false);
    expect(await s.load()).toBe(false);
  });

  it('erreur réseau pendant le renouvellement : la session est conservée', async () => {
    const s = new SessionManager(memoryStore(), clock);
    await s.save(tokens('a', now, 10));
    s.setRefresher(async () => {
      throw new Error('offline');
    });
    expect(await s.accessToken()).toBeNull();
    expect(await s.load()).toBe(true);
  });

  it('refuse un contenu de stockage altéré', async () => {
    const store = memoryStore();
    store.data.set('mm.session.v1', '{"access_token":"x"}');
    const s = new SessionManager(store, clock);
    expect(await s.load()).toBe(false);
  });
});

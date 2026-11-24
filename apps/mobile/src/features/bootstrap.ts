import { configureClient, type CartTokenStore } from '@/api/client';
import { refreshTokens } from '@/api/mobile/auth';
import { SessionManager } from '@/features/auth/session';
import { secureStore } from '@/lib/secure-storage';

/** Instances uniques de l'app, branchées sur le client API une seule fois. */
export const session = new SessionManager(secureStore);
session.setRefresher(refreshTokens);

const CART_KEY = 'mm.cart.v1';
export const cartTokenStore: CartTokenStore & { clear(): Promise<void> } = {
  async get() {
    try {
      const raw = await secureStore.get(CART_KEY);
      const v = raw ? (JSON.parse(raw) as { cartToken?: string; nonce?: string }) : {};
      return { cartToken: v.cartToken ?? null, nonce: v.nonce ?? null };
    } catch {
      return { cartToken: null, nonce: null };
    }
  },
  async set(cartToken, nonce) {
    const current = await this.get();
    await secureStore.set(
      CART_KEY,
      JSON.stringify({ cartToken: cartToken ?? current.cartToken, nonce: nonce ?? current.nonce }),
    );
  },
  clear: () => secureStore.remove(CART_KEY),
};

configureClient({ auth: session, cart: cartTokenStore });

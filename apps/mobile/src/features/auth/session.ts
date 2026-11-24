import { z } from 'zod';

import type { KeyValueStore } from '@/lib/secure-storage';

export const tokensSchema = z.object({
  access_token: z.string().regex(/^[a-f0-9]{64}$/),
  access_expires_at: z.number(),
  refresh_token: z.string().regex(/^[a-f0-9]{64}$/),
  refresh_expires_at: z.number(),
  token_type: z.literal('Bearer'),
});
export type Tokens = z.infer<typeof tokensSchema>;

const KEY = 'mm.session.v1';
/** On renouvelle le jeton d'accès 60 s avant son expiration. */
const EARLY_REFRESH_S = 60;

export type Refresher = (refreshToken: string) => Promise<Tokens | null>;

/**
 * Session de l'app (ADR-02) : jetons dans le stockage sécurisé, renouvellement automatique
 * « une seule requête à la fois » (plusieurs écrans qui demandent un jeton en même temps
 * ne déclenchent qu'un seul renouvellement : sinon le second serait vu comme un vol).
 */
export class SessionManager {
  private tokens: Tokens | null = null;
  private loaded = false;
  private inflight: Promise<Tokens | null> | null = null;
  private listeners = new Set<(signedIn: boolean) => void>();
  private refresher: Refresher | null = null;

  constructor(
    private readonly store: KeyValueStore,
    private readonly now: () => number = () => Math.floor(Date.now() / 1000),
  ) {}

  setRefresher(fn: Refresher): void {
    this.refresher = fn;
  }

  onChange(fn: (signedIn: boolean) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  async load(): Promise<boolean> {
    if (!this.loaded) {
      this.loaded = true;
      try {
        const raw = await this.store.get(KEY);
        const parsed = raw ? tokensSchema.safeParse(JSON.parse(raw)) : null;
        this.tokens = parsed?.success ? parsed.data : null;
      } catch {
        this.tokens = null;
      }
    }
    return this.tokens !== null && this.tokens.refresh_expires_at > this.now();
  }

  async save(tokens: Tokens): Promise<void> {
    this.tokens = tokensSchema.parse(tokens);
    this.loaded = true;
    await this.store.set(KEY, JSON.stringify(this.tokens));
    this.emit(true);
  }

  async clear(): Promise<void> {
    const was = this.tokens !== null;
    this.tokens = null;
    this.loaded = true;
    await this.store.remove(KEY);
    if (was) this.emit(false);
  }

  /** Jeton d'accès valide (renouvelé si besoin), ou null si l'utilisateur n'est pas connecté. */
  async accessToken(): Promise<string | null> {
    await this.load();
    const t = this.tokens;
    if (!t) return null;
    if (t.access_expires_at - EARLY_REFRESH_S > this.now()) return t.access_token;
    const fresh = await this.refresh();
    return fresh?.access_token ?? null;
  }

  /** Renouvellement forcé (après un 401). Une seule requête réseau même si appelé en parallèle. */
  refresh(): Promise<Tokens | null> {
    this.inflight ??= this.doRefresh().finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }

  private async doRefresh(): Promise<Tokens | null> {
    const t = this.tokens;
    if (!t || !this.refresher || t.refresh_expires_at <= this.now()) {
      await this.clear();
      return null;
    }
    const fresh = await this.refresher(t.refresh_token).catch(() => undefined);
    if (fresh === undefined) return null; // erreur réseau : on garde la session, on réessaiera
    if (fresh === null) {
      await this.clear(); // refusé par le serveur : session terminée
      return null;
    }
    await this.save(fresh);
    return fresh;
  }

  private emit(signedIn: boolean): void {
    this.listeners.forEach((l) => l(signedIn));
  }
}

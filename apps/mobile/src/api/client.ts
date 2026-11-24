import type { z } from 'zod';

import { ApiError, errorFromStatus } from '@/api/errors';
import { apiBaseUrl, appVersion, recetteAccessCode } from '@/config/env';

/** Fournisseurs injectés au démarrage (session et panier) — évite les dépendances circulaires. */
export interface AuthProvider {
  accessToken(): Promise<string | null>;
  refresh(): Promise<unknown>;
}
export interface CartTokenStore {
  get(): Promise<{ cartToken: string | null; nonce: string | null }>;
  set(cartToken: string | null, nonce: string | null): Promise<void>;
}

let auth: AuthProvider | null = null;
let cartTokens: CartTokenStore | null = null;
export function configureClient(deps: { auth?: AuthProvider; cart?: CartTokenStore }) {
  if (deps.auth) auth = deps.auth;
  if (deps.cart) cartTokens = deps.cart;
}

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions<S extends z.ZodType> {
  path: string;
  schema: S;
  method?: Method;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  /** 'required' : refus si non connecté ; 'optional' : jeton envoyé s'il existe. */
  auth?: 'required' | 'optional' | 'none';
  /** Requête de panier Store API : envoie et mémorise Cart-Token / Nonce. */
  cart?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
  /** Injection pour les tests. */
  fetchImpl?: typeof fetch;
  baseUrl?: string;
}

export interface ApiResponse<T> {
  data: T;
  headers: Headers;
}

export function defaultHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json', 'X-App-Version': appVersion };
  const recette = recetteAccessCode();
  if (recette) headers['X-MO-Recette-Acces'] = recette;
  return headers;
}

export function buildUrl(base: string, path: string, query?: RequestOptions<z.ZodType>['query']): string {
  const url = new URL(path, base);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function parseError(response: Response): Promise<ApiError> {
  const base = errorFromStatus(response.status);
  try {
    const body = (await response.json()) as { code?: unknown; message?: unknown };
    const code = typeof body.code === 'string' ? body.code : undefined;
    const message = typeof body.message === 'string' ? body.message : undefined;
    return new ApiError(base.code, base.message, response.status, code, message);
  } catch {
    return base;
  }
}

/**
 * Requête typée : délai maximal, annulation, jamais de cookie, détection du blocage
 * (réponse HTML), jeton de session (renouvelé une fois sur 401), jeton de panier,
 * validation Zod de la réponse.
 */
export async function apiRequest<S extends z.ZodType>(opts: RequestOptions<S>): Promise<ApiResponse<z.infer<S>>> {
  const first = await send(opts, false);
  if (first.retryAfterRefresh) return send(opts, true).then((r) => r.result!);
  return first.result!;
}

async function send<S extends z.ZodType>(
  opts: RequestOptions<S>,
  isRetry: boolean,
): Promise<{ result?: ApiResponse<z.infer<S>>; retryAfterRefresh?: boolean }> {
  const doFetch = opts.fetchImpl ?? fetch;
  const headers = defaultHeaders();
  const mode = opts.auth ?? 'none';

  if (mode !== 'none' && auth) {
    const token = await auth.accessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    else if (mode === 'required') throw new ApiError('unauthorized', 'Non connecté', 401);
  }
  if (opts.cart && cartTokens) {
    const t = await cartTokens.get();
    if (t.cartToken) headers['Cart-Token'] = t.cartToken;
    if (t.nonce) headers.Nonce = t.nonce;
  }
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 15_000);
  const onAbort = () => controller.abort();
  opts.signal?.addEventListener('abort', onAbort);

  let response: Response;
  try {
    response = await doFetch(buildUrl(opts.baseUrl ?? apiBaseUrl(), opts.path, opts.query), {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      // Jamais de cookie : l'identité passe uniquement par le jeton (ADR-02).
      credentials: 'omit',
      signal: controller.signal,
    });
  } catch {
    if (opts.signal?.aborted) throw new ApiError('unknown', 'Requête annulée');
    throw controller.signal.aborted ? new ApiError('timeout', 'Délai dépassé') : new ApiError('network', 'Réseau indisponible');
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener('abort', onAbort);
  }

  if (opts.cart && cartTokens) {
    const ct = response.headers.get('cart-token');
    const nonce = response.headers.get('nonce');
    if (ct || nonce) await cartTokens.set(ct, nonce);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    // Page HTML : protection de la recette, défi anti-robots ou erreur de l'hébergeur.
    throw new ApiError('blocked', `Réponse non JSON (HTTP ${response.status})`, response.status);
  }
  if (!response.ok) {
    const err = await parseError(response);
    if (response.status === 401 && err.serverCode === 'mm_invalid_token' && auth && !isRetry && mode !== 'none') {
      await auth.refresh();
      return { retryAfterRefresh: true };
    }
    throw err;
  }

  const parsed = opts.schema.safeParse(await response.json());
  if (!parsed.success) throw new ApiError('invalid_response', 'Format de réponse inattendu');
  return { result: { data: parsed.data, headers: response.headers } };
}

/** Raccourci GET (catalogue). */
export function apiGet<S extends z.ZodType>(opts: Omit<RequestOptions<S>, 'method' | 'body'>) {
  return apiRequest({ ...opts, method: 'GET' });
}

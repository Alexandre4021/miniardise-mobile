import type { z } from 'zod';

import { ApiError, errorFromStatus } from '@/api/errors';
import { apiBaseUrl, appVersion, recetteAccessCode } from '@/config/env';

export interface RequestOptions<S extends z.ZodType> {
  path: string;
  schema: S;
  query?: Record<string, string | number | undefined>;
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

/**
 * GET typé : délai maximal, annulation, détection du blocage anti-robots (réponse HTML au
 * lieu de JSON) et validation Zod de la réponse. Les écritures (POST) arriveront avec
 * l'authentification et l'en-tête Idempotency-Key.
 */
export async function apiGet<S extends z.ZodType>(opts: RequestOptions<S>): Promise<ApiResponse<z.infer<S>>> {
  const doFetch = opts.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 15_000);
  const onAbort = () => controller.abort();
  opts.signal?.addEventListener('abort', onAbort);

  let response: Response;
  try {
    response = await doFetch(buildUrl(opts.baseUrl ?? apiBaseUrl(), opts.path, opts.query), {
      method: 'GET',
      headers: defaultHeaders(),
      // Jamais de cookie : l'identité passe uniquement par le jeton (ADR-02), pas par une session web.
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

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  if (!isJson) {
    // Page HTML : protection de la recette, défi anti-robots (Anubis) ou erreur de l'hébergeur.
    // Jamais présentée comme une « session expirée ».
    throw new ApiError('blocked', `Réponse non JSON (HTTP ${response.status})`, response.status);
  }
  if (!response.ok) throw errorFromStatus(response.status);

  const parsed = opts.schema.safeParse(await response.json());
  if (!parsed.success) throw new ApiError('invalid_response', 'Format de réponse inattendu');
  return { data: parsed.data, headers: response.headers };
}

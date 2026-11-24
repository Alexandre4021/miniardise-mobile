import Constants from 'expo-constants';

export type AppVariant = 'development' | 'preview' | 'production';

const ALLOWED_HOSTS: Record<AppVariant, readonly string[]> = {
  // En développement : WordPress local ou recette.
  development: ['localhost', '10.0.2.2', '127.0.0.1', 'recette.epiceriefineminiardise.fr'],
  preview: ['recette.epiceriefineminiardise.fr'],
  production: ['epiceriefineminiardise.fr'],
};

export function resolveVariant(raw: unknown): AppVariant {
  return raw === 'preview' || raw === 'production' ? raw : 'development';
}

/**
 * Vérifie que l'URL d'API correspond à la variante : une app de production ne peut pas
 * viser la recette, et inversement. HTTPS obligatoire hors machine locale.
 */
export function validateApiUrl(rawUrl: string | undefined, variant: AppVariant): string {
  if (!rawUrl) throw new Error('EXPO_PUBLIC_API_URL manquant');
  const url = new URL(rawUrl);
  const isLocal = ['localhost', '10.0.2.2', '127.0.0.1'].includes(url.hostname);
  if (!isLocal && url.protocol !== 'https:') throw new Error('HTTPS obligatoire');
  if (!ALLOWED_HOSTS[variant].includes(url.hostname)) {
    throw new Error(`Hôte ${url.hostname} interdit pour la variante ${variant}`);
  }
  return url.origin;
}

export const appVariant = resolveVariant(Constants.expoConfig?.extra?.variant);
export const appVersion = Constants.expoConfig?.version ?? '0.0.0';

let cachedApiUrl: string | null = null;
export function apiBaseUrl(): string {
  cachedApiUrl ??= validateApiUrl(process.env.EXPO_PUBLIC_API_URL, appVariant);
  return cachedApiUrl;
}

/**
 * Traduit un lien du site (saisi dans le carrousel) en destination dans l'app.
 * Liens du site connus → écrans natifs ; autres liens → navigateur intégré.
 */
export type LinkTarget =
  | { type: 'shop' }
  | { type: 'category'; slug: string }
  | { type: 'product'; slug: string }
  | { type: 'web'; url: string };

const SITE_HOSTS = ['epiceriefineminiardise.fr', 'www.epiceriefineminiardise.fr', 'recette.epiceriefineminiardise.fr'];

export function resolveSiteLink(raw: string): LinkTarget {
  if (!raw) return { type: 'shop' };
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { type: 'shop' };
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return { type: 'shop' };
  if (!SITE_HOSTS.includes(url.hostname)) return { type: 'web', url: url.toString() };

  const parts = url.pathname.split('/').filter(Boolean);
  if (parts[0] === 'produit' && parts[1]) return { type: 'product', slug: decodeURIComponent(parts[1]) };
  if (parts[0] === 'categorie-produit' && parts.length > 1) {
    return { type: 'category', slug: decodeURIComponent(parts[parts.length - 1]) };
  }
  if (parts.length === 0 || parts[0] === 'boutique') return { type: 'shop' };
  return { type: 'web', url: url.toString() };
}

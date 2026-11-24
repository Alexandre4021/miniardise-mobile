import { resolveSiteLink } from '@/utils/site-link';

describe('resolveSiteLink', () => {
  it('lien vide ou invalide → boutique', () => {
    expect(resolveSiteLink('')).toEqual({ type: 'shop' });
    expect(resolveSiteLink('pas une url')).toEqual({ type: 'shop' });
    expect(resolveSiteLink('javascript:alert(1)')).toEqual({ type: 'shop' });
  });
  it('fiche produit du site → écran produit', () =>
    expect(resolveSiteLink('https://epiceriefineminiardise.fr/produit/melange-sportif/')).toEqual({ type: 'product', slug: 'melange-sportif' }));
  it('catégorie du site → boutique filtrée', () =>
    expect(resolveSiteLink('https://epiceriefineminiardise.fr/categorie-produit/pistache/')).toEqual({ type: 'category', slug: 'pistache' }));
  it('page boutique → onglet Boutique', () =>
    expect(resolveSiteLink('https://epiceriefineminiardise.fr/boutique/')).toEqual({ type: 'shop' }));
  it('autre page du site ou site externe → navigateur intégré', () => {
    expect(resolveSiteLink('https://epiceriefineminiardise.fr/a-propos/')).toEqual({ type: 'web', url: 'https://epiceriefineminiardise.fr/a-propos/' });
    expect(resolveSiteLink('https://instagram.com/miniardise')).toEqual({ type: 'web', url: 'https://instagram.com/miniardise' });
  });
});

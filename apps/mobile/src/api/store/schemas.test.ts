import fixture from '@/api/store/__fixtures__/product.json';
import { productSchema } from '@/api/store/schemas';

describe('productSchema (réponse réelle de la Store API, 24/11/2026)', () => {
  it('accepte un produit variable de la boutique', () => {
    const p = productSchema.parse(fixture);
    expect(p.id).toBe(6166);
    expect(p.attributes[0].terms[0].name).toBe('200 g');
  });

  it('refuse un prix non numérique (réponse altérée)', () => {
    const bad = { ...fixture, prices: { ...fixture.prices, price: '4,90' } };
    expect(productSchema.safeParse(bad).success).toBe(false);
  });

  it('ignore les champs inconnus ajoutés par une future version de WooCommerce', () => {
    expect(productSchema.safeParse({ ...fixture, nouveau_champ: true }).success).toBe(true);
  });
});

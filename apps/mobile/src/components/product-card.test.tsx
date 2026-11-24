import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import fixture from '@/api/store/__fixtures__/product.json';
import type { Product } from '@/api/store/schemas';
import { ProductCard } from '@/components/product-card';
import { renderWithQuery } from '@/test/render';

const mockAddToCart = jest.fn();
jest.mock('@/api/store/cart', () => ({
  ...jest.requireActual('@/api/store/cart'),
  addToCart: (...args: unknown[]) => mockAddToCart(...args),
}));
jest.mock('expo-router', () => ({ Link: ({ children }: { children: React.ReactNode }) => children }));

const variations = [
  { id: 11, label: '250 g', price: 690, in_stock: true, max: null },
  { id: 12, label: '500 g', price: 1290, in_stock: true, max: null },
  { id: 13, label: '1 kg', price: 2390, in_stock: false, max: null },
];
const product = { ...fixture, extensions: { 'miniardise-mobile': { variations } } } as unknown as Product;
const emptyCart = { items: [], items_count: 0 };

describe('ProductCard (boutique / accueil)', () => {
  beforeEach(() => mockAddToCart.mockReset().mockResolvedValue(emptyCart));

  it('affiche le prix du premier poids disponible et les formats, épuisé désactivé', async () => {
    await renderWithQuery(<ProductCard product={product} />);
    expect(screen.getByText('6,90 €')).toBeTruthy();
    expect(screen.getByRole('radio', { name: /1 kg.*épuisé/ })).toBeDisabled();
  });

  it('change de poids puis ajoute la bonne déclinaison avec la quantité choisie', async () => {
    await renderWithQuery(<ProductCard product={product} />);
    await fireEvent.press(screen.getByRole('radio', { name: /500 g/ }));
    expect(screen.getByText('12,90 €')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Augmenter la quantité'));
    await fireEvent.press(screen.getByRole('button', { name: 'Ajouter' }));
    await waitFor(() => expect(mockAddToCart).toHaveBeenCalledWith(12, 2));
    expect(await screen.findByText('Ajouté')).toBeTruthy();
  });

  it('erreur serveur (rupture) : message affiché, pas de confirmation', async () => {
    const { ApiError } = jest.requireActual('@/api/errors');
    mockAddToCart.mockRejectedValue(new ApiError('unknown', 'x', 400, 'woocommerce_rest_product_out_of_stock', 'Ce produit est en rupture de stock.'));
    await renderWithQuery(<ProductCard product={product} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Ajouter' }));
    expect(await screen.findByText('Ce produit est en rupture de stock.')).toBeTruthy();
    expect(screen.queryByText('Ajouté')).toBeNull();
  });

  it('produit variable sans données de poids : bouton « Choisir » vers la fiche', async () => {
    await renderWithQuery(<ProductCard product={fixture as unknown as Product} />);
    expect(screen.getByText('Choisir')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Ajouter' })).toBeNull();
  });

  it('produit variable sans aucun format publié : « Indisponible », pas de bouton', async () => {
    const empty = { ...fixture, extensions: { 'miniardise-mobile': { variations: [] } } } as unknown as Product;
    await renderWithQuery(<ProductCard product={empty} />);
    expect(screen.getByText('Indisponible')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Ajouter' })).toBeNull();
  });
});

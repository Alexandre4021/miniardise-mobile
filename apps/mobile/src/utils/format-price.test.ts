import fixture from '@/api/store/__fixtures__/product.json';
import { formatAmount, priceLabel } from '@/utils/format-price';

const eur = fixture.prices;

describe('formatAmount', () => {
  it.each([
    ['490', '4,90 €'],
    ['5', '0,05 €'],
    ['0', '0,00 €'],
    ['123456', '1 234,56 €'],
    ['-990', '-9,90 €'],
  ])('%s centimes → %s', (minor, expected) => {
    expect(formatAmount(minor, eur)).toBe(expected);
  });
});

describe('priceLabel', () => {
  it('prix unique', () => expect(priceLabel(eur)).toBe('4,90 €'));
  it('fourchette de prix', () =>
    expect(priceLabel({ ...eur, price_range: { min_amount: '490', max_amount: '1890' } })).toBe('dès 4,90 €'));
});

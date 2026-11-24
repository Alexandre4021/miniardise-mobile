import { resolveVariant, validateApiUrl } from '@/config/env';

describe('validateApiUrl', () => {
  it('accepte la recette en preview', () =>
    expect(validateApiUrl('https://recette.epiceriefineminiardise.fr/', 'preview')).toBe('https://recette.epiceriefineminiardise.fr'));
  it('refuse la production dans une app de recette', () =>
    expect(() => validateApiUrl('https://epiceriefineminiardise.fr', 'preview')).toThrow());
  it('refuse la recette dans une app de production', () =>
    expect(() => validateApiUrl('https://recette.epiceriefineminiardise.fr', 'production')).toThrow());
  it('impose HTTPS hors machine locale', () =>
    expect(() => validateApiUrl('http://recette.epiceriefineminiardise.fr', 'development')).toThrow('HTTPS'));
  it('autorise le WordPress local en HTTP en développement', () =>
    expect(validateApiUrl('http://localhost:8888', 'development')).toBe('http://localhost:8888'));
  it('variante inconnue → development', () => expect(resolveVariant('x')).toBe('development'));
});

import { ApiError } from '@/api/errors';
import { registerOrRecover } from '@/features/auth/auth-context';

jest.mock('expo-device', () => ({ manufacturer: 'Apple', modelName: 'iPhone' }));

const input = { email: 'a@b.fr', password: 'MotDePasse-2026', first_name: 'A', last_name: 'B', device: 'iPhone' };
const ok = { tokens: {} as never, user: { id: 1, email: 'a@b.fr', first_name: 'A', last_name: 'B', phone: '' } };

describe('registerOrRecover', () => {
  it('inscription normale', async () => {
    const login = jest.fn();
    await expect(registerOrRecover(input, { register: jest.fn().mockResolvedValue(ok), login })).resolves.toBe(ok);
    expect(login).not.toHaveBeenCalled();
  });

  it('réponse perdue (délai dépassé) mais compte créé : connexion automatique', async () => {
    const register = jest.fn().mockRejectedValue(new ApiError('timeout', 'Délai dépassé'));
    const login = jest.fn().mockResolvedValue(ok);
    await expect(registerOrRecover(input, { register, login })).resolves.toBe(ok);
    expect(login).toHaveBeenCalledWith({ login: 'a@b.fr', password: 'MotDePasse-2026', device: 'iPhone' });
  });

  it('délai dépassé et compte non créé : erreur d’origine', async () => {
    const err = new ApiError('timeout', 'Délai dépassé');
    await expect(
      registerOrRecover(input, { register: jest.fn().mockRejectedValue(err), login: jest.fn().mockRejectedValue(new ApiError('unauthorized', 'x', 401)) }),
    ).rejects.toBe(err);
  });

  it('refus métier (compte existant) : pas de tentative de connexion', async () => {
    const login = jest.fn();
    const err = new ApiError('unknown', 'x', 400, 'mm_registration_failed', 'Impossible de créer ce compte.');
    await expect(registerOrRecover(input, { register: jest.fn().mockRejectedValue(err), login })).rejects.toBe(err);
    expect(login).not.toHaveBeenCalled();
  });
});

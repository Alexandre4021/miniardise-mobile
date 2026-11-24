import { useQueryClient } from '@tanstack/react-query';
import * as Device from 'expo-device';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { fetchMe } from '@/api/mobile/account';
import { login as apiLogin, logout as apiLogout, register as apiRegister, type User } from '@/api/mobile/auth';
import { cartTokenStore, session } from '@/features/bootstrap';

type Status = 'loading' | 'signedOut' | 'signedIn';

interface AuthValue {
  status: Status;
  user: User | null;
  login(loginValue: string, password: string): Promise<void>;
  register(input: { email: string; password: string; first_name: string; last_name: string }): Promise<void>;
  logout(all?: boolean): Promise<void>;
  setUser(u: User): void;
}

const AuthContext = createContext<AuthValue | null>(null);

const deviceLabel = () => [Device.manufacturer, Device.modelName].filter(Boolean).join(' ').slice(0, 100) || 'Application mobile';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const has = await session.load();
      if (!has) {
        if (alive) setStatus('signedOut');
        return;
      }
      try {
        const me = await fetchMe();
        if (alive) {
          setUser(me);
          setStatus('signedIn');
        }
      } catch {
        // Hors connexion : on reste connecté si la session existe encore localement.
        if (alive) setStatus((await session.load()) ? 'signedIn' : 'signedOut');
      }
    })();
    const off = session.onChange((signedIn) => {
      if (!signedIn) {
        setUser(null);
        setStatus('signedOut');
      }
    });
    return () => {
      alive = false;
      off();
    };
  }, []);

  const afterAuth = useCallback(
    async (r: { tokens: Parameters<typeof session.save>[0]; user: User }) => {
      await session.save(r.tokens);
      setUser(r.user);
      setStatus('signedIn');
      // Le panier est rechargé avec l'identité du client (adresses, tarifs, livraison).
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    [queryClient],
  );

  const value = useMemo<AuthValue>(
    () => ({
      status,
      user,
      setUser,
      login: async (loginValue, password) => afterAuth(await apiLogin({ login: loginValue, password, device: deviceLabel() })),
      register: async (input) => afterAuth(await apiRegister({ ...input, device: deviceLabel() })),
      logout: async (all = false) => {
        await apiLogout(all).catch(() => undefined); // même hors ligne, on efface la session locale
        await session.clear();
        await cartTokenStore.clear();
        queryClient.removeQueries({ queryKey: ['account'] });
        queryClient.removeQueries({ queryKey: ['cart'] });
      },
    }),
    [status, user, afterAuth, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth hors AuthProvider');
  return v;
}

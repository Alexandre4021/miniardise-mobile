import '@/features/bootstrap';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { ApiError } from '@/api/errors';
import { AuthProvider } from '@/features/auth/auth-context';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Nouvelles tentatives seulement sur erreurs réseau / serveur, jamais sur 4xx.
        retry: (count, error) =>
          count < 3 && error instanceof ApiError && ['network', 'timeout', 'server'].includes(error.code),
      },
      mutations: {
        // Jamais de nouvelle tentative automatique sur une écriture (panier, compte).
        retry: false,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },
    },
  });
}

export default function RootLayout() {
  const [queryClient] = useState(makeQueryClient);
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: colors.ink,
          headerStyle: { backgroundColor: colors.cream },
          contentStyle: { backgroundColor: colors.cream },
          headerBackButtonDisplayMode: 'minimal',
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="produit/[id]" options={{ title: '' }} />
        <Stack.Screen name="inscription" options={{ title: 'Créer un compte', presentation: 'modal' }} />
        <Stack.Screen name="mot-de-passe-oublie" options={{ title: 'Mot de passe oublié', presentation: 'modal' }} />
        <Stack.Screen name="commandes/index" options={{ title: 'Mes commandes' }} />
        <Stack.Screen name="commandes/[id]" options={{ title: 'Commande' }} />
        <Stack.Screen name="adresses" options={{ title: 'Mes adresses' }} />
      </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}

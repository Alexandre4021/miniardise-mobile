import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Stockage des secrets (jetons de session, jeton de panier) : Keychain iOS / Keystore Android.
 * Sur le web (aperçus de développement uniquement), mémoire volatile.
 */
export interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

const memory = new Map<string, string>();

export const secureStore: KeyValueStore =
  Platform.OS === 'web'
    ? {
        get: async (k) => memory.get(k) ?? null,
        set: async (k, v) => void memory.set(k, v),
        remove: async (k) => void memory.delete(k),
      }
    : {
        get: (k) => SecureStore.getItemAsync(k),
        set: (k, v) => SecureStore.setItemAsync(k, v, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK }),
        remove: (k) => SecureStore.deleteItemAsync(k),
      };

import { Redirect } from 'expo-router';

import { useAuth } from '@/features/auth/auth-context';
import { AddressesScreen } from '@/screens/account/addresses';

export default function AddressesRoute() {
  const { status } = useAuth();
  if (status === 'signedOut') return <Redirect href="/compte" />;
  return <AddressesScreen />;
}

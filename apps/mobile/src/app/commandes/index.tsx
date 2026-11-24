import { Redirect } from 'expo-router';

import { useAuth } from '@/features/auth/auth-context';
import { OrdersScreen } from '@/screens/account/orders';

export default function OrdersRoute() {
  const { status } = useAuth();
  if (status === 'signedOut') return <Redirect href="/compte" />;
  return <OrdersScreen />;
}

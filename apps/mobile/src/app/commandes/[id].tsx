import { Redirect, useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/components/screen-state';
import { useAuth } from '@/features/auth/auth-context';
import { OrderDetailScreen } from '@/screens/account/order-detail';

export default function OrderRoute() {
  const { status } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  if (status === 'signedOut') return <Redirect href="/compte" />;
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) return <EmptyState message="Commande introuvable." />;
  return <OrderDetailScreen id={n} />;
}

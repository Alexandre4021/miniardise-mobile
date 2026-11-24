import { useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/components/screen-state';
import { ProductDetail } from '@/screens/product';

export default function ProductRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) return <EmptyState message="Produit introuvable." />;
  return <ProductDetail id={productId} />;
}

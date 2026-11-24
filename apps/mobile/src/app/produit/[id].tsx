import { useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/components/screen-state';
import { ProductDetail } from '@/screens/product';

/** /produit/123 (identifiant) ou /produit/melange-sportif (slug, liens du carrousel). */
export default function ProductRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const raw = String(id ?? '');
  if (/^\d+$/.test(raw) && Number(raw) > 0) return <ProductDetail productRef={Number(raw)} />;
  if (/^[a-z0-9-]{1,200}$/i.test(raw)) return <ProductDetail productRef={raw.toLowerCase()} />;
  return <EmptyState message="Produit introuvable." />;
}

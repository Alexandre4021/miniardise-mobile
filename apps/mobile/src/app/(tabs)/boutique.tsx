import { useLocalSearchParams } from 'expo-router';

import { Shop } from '@/screens/shop';

export default function ShopRoute() {
  const { categorie } = useLocalSearchParams<{ categorie?: string }>();
  const id = categorie ? Number(categorie) : undefined;
  return <Shop initialCategory={Number.isInteger(id) && id! > 0 ? id : undefined} />;
}

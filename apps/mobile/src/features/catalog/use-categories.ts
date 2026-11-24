import { useQuery } from '@tanstack/react-query';

import { categoriesQuery } from '@/features/catalog/queries';
import { categoryRank, categoryStyle } from '@/theme/categories';
import { decodeEntities } from '@/utils/html';

/** Catégories triées dans l'ordre du site, avec leurs couleurs et pictogrammes. */
export function useStyledCategories() {
  const q = useQuery(categoriesQuery());
  const items = (q.data ?? [])
    .map((c) => ({ id: c.id, slug: c.slug, name: decodeEntities(c.name), style: categoryStyle(c.slug) }))
    .sort((a, b) => categoryRank(a.slug) - categoryRank(b.slug) || a.name.localeCompare(b.name, 'fr'));
  return { ...q, items };
}

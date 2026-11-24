import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

import { fetchCategories, fetchProduct, fetchProducts } from '@/api/store/products';

const FIVE_MIN = 5 * 60_000;

export const catalogKeys = {
  all: ['catalog'] as const,
  categories: () => [...catalogKeys.all, 'categories'] as const,
  list: (f: { category?: number; search?: string }) => [...catalogKeys.all, 'list', f] as const,
  product: (id: number) => [...catalogKeys.all, 'product', id] as const,
};

export const categoriesQuery = () =>
  queryOptions({
    queryKey: catalogKeys.categories(),
    queryFn: ({ signal }) => fetchCategories(signal),
    staleTime: 30 * 60_000,
  });

export const productListQuery = (f: { category?: number; search?: string }) =>
  infiniteQueryOptions({
    queryKey: catalogKeys.list(f),
    queryFn: ({ pageParam, signal }) => fetchProducts({ page: pageParam, ...f, signal }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    staleTime: FIVE_MIN, // prix et stock revalidés par le panier avant paiement
  });

export const productQuery = (id: number) =>
  queryOptions({
    queryKey: catalogKeys.product(id),
    queryFn: ({ signal }) => fetchProduct(id, signal),
    staleTime: FIVE_MIN,
  });

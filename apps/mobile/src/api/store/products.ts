import { apiGet } from '@/api/client';
import { categoryListSchema, productListSchema, productSchema } from '@/api/store/schemas';

export const PRODUCTS_PER_PAGE = 20;

export interface ProductListParams {
  page: number;
  category?: number;
  search?: string;
  orderby?: 'date' | 'price' | 'popularity' | 'title' | 'menu_order';
  order?: 'asc' | 'desc';
  signal?: AbortSignal;
}

export async function fetchProducts(p: ProductListParams) {
  const { data, headers } = await apiGet({
    path: '/wp-json/wc/store/v1/products',
    schema: productListSchema,
    query: {
      page: p.page,
      per_page: PRODUCTS_PER_PAGE,
      category: p.category,
      search: p.search?.trim(),
      orderby: p.orderby ?? 'menu_order',
      order: p.order ?? 'asc',
    },
    signal: p.signal,
  });
  const totalPages = Number(headers.get('x-wp-totalpages') ?? '1') || 1;
  return { items: data, page: p.page, totalPages };
}

export async function fetchProduct(id: number, signal?: AbortSignal) {
  const { data } = await apiGet({ path: `/wp-json/wc/store/v1/products/${id}`, schema: productSchema, signal });
  return data;
}

export async function fetchCategories(signal?: AbortSignal) {
  const { data } = await apiGet({
    path: '/wp-json/wc/store/v1/products/categories',
    schema: categoryListSchema,
    signal,
  });
  // Catégories techniques héritées (« Non classé », poids) masquées côté app.
  return data.filter((c) => c.count > 0 && !/^(non class|\d+\s?(g|kg)$)/i.test(c.name));
}

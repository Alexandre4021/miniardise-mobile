import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addToCart,
  applyCoupon,
  fetchCart,
  removeCartItem,
  removeCoupon,
  selectShippingRate,
  updateCartItem,
  updateShippingDestination,
  type Cart,
} from '@/api/store/cart';

export const cartKey = ['cart'] as const;

/** Panier = état du serveur WooCommerce (jamais calculé dans l'app). */
export function useCart() {
  return useQuery({ queryKey: cartKey, queryFn: ({ signal }) => fetchCart(signal), staleTime: 0 });
}

export function useCartCount(): number {
  return useCart().data?.items_count ?? 0;
}

function useCartMutation<V>(fn: (v: V) => Promise<Cart>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (cart) => qc.setQueryData(cartKey, cart),
    // En cas d'échec (stock, prix modifié…), on recharge l'état réel du panier.
    onError: () => qc.invalidateQueries({ queryKey: cartKey }),
  });
}

export const useAddToCart = () => useCartMutation((v: { id: number; quantity: number }) => addToCart(v.id, v.quantity));
export const useUpdateCartItem = () => useCartMutation((v: { key: string; quantity: number }) => updateCartItem(v.key, v.quantity));
export const useRemoveCartItem = () => useCartMutation((key: string) => removeCartItem(key));
export const useApplyCoupon = () => useCartMutation((code: string) => applyCoupon(code.trim()));
export const useRemoveCoupon = () => useCartMutation((code: string) => removeCoupon(code));
export const useShippingDestination = () =>
  useCartMutation((a: { postcode: string; city: string; country: string }) => updateShippingDestination(a));
export const useSelectShippingRate = () =>
  useCartMutation((v: { packageId: number | string; rateId: string }) => selectShippingRate(v.packageId, v.rateId));

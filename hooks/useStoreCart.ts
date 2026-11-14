'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getCart,
  removeFromCart,
  updateQuantity,
  type Cart,
} from '@/lib/store/cart';

export function useStoreCart() {
  const [cart, setCart] = useState<Cart>({ items: [], total: 0, itemCount: 0 });

  const refresh = useCallback(() => {
    setCart(getCart());
  }, []);

  useEffect(() => {
    refresh();

    const onCartUpdated = () => refresh();
    window.addEventListener('cartUpdated', onCartUpdated);
    return () => window.removeEventListener('cartUpdated', onCartUpdated);
  }, [refresh]);

  const removeItem = useCallback(
    (productId: string) => {
      setCart(removeFromCart(productId));
    },
    [],
  );

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setCart(updateQuantity(productId, quantity));
  }, []);

  return { cart, refresh, removeItem, setQuantity };
}

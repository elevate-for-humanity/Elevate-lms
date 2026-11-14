'use client';

import { useState, useEffect } from 'react';
import { getCart, removeFromCart, updateQuantity, clearCart, CartItem } from './cart';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const cart = getCart();
    setItems(cart.items);
    setTotal(cart.total);

    const handleUpdate = (e: any) => {
      const cart = e.detail;
      setItems(cart.items);
      setTotal(cart.total);
    };

    window.addEventListener('cartUpdated', handleUpdate);
    return () => window.removeEventListener('cartUpdated', handleUpdate);
  }, []);

  const handleRemove = (productId: string) => {
    removeFromCart(productId);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    updateQuantity(productId, quantity);
  };

  const handleClear = () => {
    clearCart();
  };

  return {
    items: items.map(i => ({ id: i.product.id, name: i.product.name, price: i.product.price, quantity: i.quantity })),
    total,
    removeItem: handleRemove,
    updateQuantity: handleUpdateQuantity,
    clearCart: handleClear
  };
}

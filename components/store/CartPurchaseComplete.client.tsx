'use client';

import { useEffect } from 'react';
import { clearCart } from '@/lib/store/cart';

export default function CartPurchaseComplete() {
  useEffect(() => { clearCart(); }, []);
  return null;
}

'use client';

import { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { addToCart } from '@/lib/store/cart';
import type { StoreProduct } from '@/lib/store/products';

interface SimpleAddToCartButtonProps {
  productId: string;
  productName: string;
  price: number;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function SimpleAddToCartButton({
  productId,
  productName,
  price,
  variant = 'primary',
  className = '',
}: SimpleAddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    setIsAdding(true);

    const product: StoreProduct = {
      id: productId,
      name: productName,
      slug: productId,
      price,
      description: `${productName} digital product`,
      image: '/images/pages/course-create-hero.webp',
      inStock: true,
      featured: false,
      digital: true,
      category: 'certification-prep',
    };

    addToCart(product, 1);

    setTimeout(() => {
      setIsAdding(false);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }, 500);
  };

  const iconClass = variant === 'secondary' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <button
      onClick={handleAddToCart}
      disabled={isAdding}
      className={`inline-flex items-center gap-2 transition-all ${className}`}
    >
      {added ? (
        <><Check className={iconClass} />{variant === 'secondary' ? 'Added!' : 'Added to Cart'}</>
      ) : isAdding ? (
        <><ShoppingCart className={`${iconClass} animate-pulse`} />Adding...</>
      ) : (
        <><ShoppingCart className={iconClass} />{variant === 'secondary' ? 'Add' : 'Add to Cart'}</>
      )}
    </button>
  );
}

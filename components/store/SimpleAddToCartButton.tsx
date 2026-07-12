'use client';

import React from 'react';
import { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { addToCart } from '@/lib/store/cart';

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
    
    // Create a minimal product object for the cart
    const product = {
      id: productId,
      name: productName,
      slug: productId,
      price: price,
      inStock: true,
      digital: true,
      category: 'certification-prep' as const,
    };

    addToCart(product as any, 1);
    
    setTimeout(() => {
      setIsAdding(false);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }, 500);
  };

  if (variant === 'secondary') {
    return (
      <button
        onClick={handleAddToCart}
        disabled={isAdding}
        className={`inline-flex items-center gap-1.5 transition-all ${className}`}
      >
        {added ? (
          <>
            <Check className="w-4 h-4" />
            Added!
          </>
        ) : isAdding ? (
          <>
            <ShoppingCart className="w-4 h-4 animate-pulse" />
            Adding...
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4" />
            Add
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={isAdding}
      className={`inline-flex items-center gap-2 transition-all ${className}`}
    >
      {added ? (
        <>
          <Check className="w-5 h-5" />
          Added to Cart
        </>
      ) : isAdding ? (
        <>
          <ShoppingCart className="w-5 h-5 animate-pulse" />
          Adding...
        </>
      ) : (
        <>
          <ShoppingCart className="w-5 h-5" />
          Add to Cart
        </>
      )}
    </button>
  );
}

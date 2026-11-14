// Shopping Cart Management
'use client';

import { StoreProduct } from './products';

export interface CartItem {
  product: StoreProduct;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

const CART_STORAGE_KEY = 'efh_shopping_cart';

// Get cart from localStorage
export function getCart(): Cart {
  if (typeof window === 'undefined') {
    return { items: [], total: 0, itemCount: 0 };
  }

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) {
      return { items: [], total: 0, itemCount: 0 };
    }

    const cart: Cart = JSON.parse(stored);
    return cart;
  } catch (error) {
    /* Error handled silently */
    // Error: $1
    return { items: [], total: 0, itemCount: 0 };
  }
}

// Save cart to localStorage
export function saveCart(cart: Cart): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));

    // Dispatch custom event for cart updates
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
  } catch (error) {
    /* Error handled silently */
    // Error: $1
  }
}

// Calculate cart totals
export function calculateCart(items: CartItem[]): Cart {
  const total = items.reduce((sum, item) => {
    const price = item.product.salePrice || item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return { items, total, itemCount };
}

// Add item to cart
export function addToCart(product: StoreProduct, quantity: number = 1): Cart {
  const cart = getCart();

  // Check if product already in cart
  const existingIndex = cart.items.findIndex((item) => item.product.id === product.id);

  if (existingIndex >= 0) {
    // Update quantity
    cart.items[existingIndex].quantity += quantity;
  } else {
    // Add new item
    cart.items.push({ product, quantity });
  }

  const updatedCart = calculateCart(cart.items);
  saveCart(updatedCart);
  return updatedCart;
}

// Remove item from cart
export function removeFromCart(productId: string): Cart {
  const cart = getCart();
  cart.items = cart.items.filter((item) => item.product.id !== productId);

  const updatedCart = calculateCart(cart.items);
  saveCart(updatedCart);
  return updatedCart;
}

// Update item quantity
export function updateQuantity(productId: string, quantity: number): Cart {
  const cart = getCart();

  if (quantity <= 0) {
    return removeFromCart(productId);
  }

  const itemIndex = cart.items.findIndex((item) => item.product.id === productId);
  if (itemIndex >= 0) {
    cart.items[itemIndex].quantity = quantity;
  }

  const updatedCart = calculateCart(cart.items);
  saveCart(updatedCart);
  return updatedCart;
}

// Clear cart
export function clearCart(): Cart {
  const emptyCart: Cart = { items: [], total: 0, itemCount: 0 };
  saveCart(emptyCart);
  return emptyCart;
}

// Get item count
export function getCartItemCount(): number {
  const cart = getCart();
  return cart.itemCount;
}

// Get cart total
export function getCartTotal(): number {
  const cart = getCart();
  return cart.total;
}

// Check if product is in cart
export function isInCart(productId: string): boolean {
  const cart = getCart();
  return cart.items.some((item) => item.product.id === productId);
}

// Get product quantity in cart
export function getProductQuantity(productId: string): number {
  const cart = getCart();
  const item = cart.items.find((item) => item.product.id === productId);
  return item?.quantity || 0;
}

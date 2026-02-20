import { logger } from '@/lib/logger';
/**
 * Database-driven Store Functions
 * All data comes from Supabase - no mock fallbacks
 */

import { createClient } from '@/lib/supabase/server';

// ============================================
// TYPES
// ============================================

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  price_cents?: number;
  compare_at_price?: number;
  type: string;
  category: string;
  category_id?: string;
  image_url: string;
  images?: ProductImage[];
  stripe_price_id?: string;
  stripe_product_id?: string;
  is_active: boolean;
  is_featured: boolean;
  badge?: string;
  audiences: string[];
  features: string[] | object[];
  tags: string[];
  inventory_quantity: number;
  track_inventory: boolean;
  requires_shipping: boolean;
  variants?: ProductVariant[];
  reviews_count?: number;
  average_rating?: number;
  // New catalog fields
  billing_type?: 'one_time' | 'subscription';
  license_type?: 'single' | 'school' | 'enterprise';
  long_description?: string;
  ideal_for?: string;
  apps_included?: string[];
  setup_fee_cents?: number;
  catalog_group?: 'store' | 'addon' | 'clone';
  sort_order?: number;
}

/**
 * Shape expected by checkout pages. Maps from DB row to checkout-compatible object.
 */
export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription?: string;
  price: number; // cents
  billingType: 'one_time' | 'subscription';
  licenseType?: 'single' | 'school' | 'enterprise';
  features: string[];
  idealFor?: string;
  appsIncluded?: string[];
  setupFeeCents?: number;
  catalogGroup?: string;
  stripeProductId?: string;
  stripePriceId?: string;
  isActive: boolean;
}

/** Convert a DB product row to the shape checkout/store pages expect. */
export function toCatalogProduct(row: Product): CatalogProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    longDescription: row.long_description || undefined,
    price: row.price_cents ?? Math.round(row.price * 100),
    billingType: row.billing_type || 'one_time',
    licenseType: row.license_type || undefined,
    features: Array.isArray(row.features) ? row.features.map(String) : [],
    idealFor: row.ideal_for || undefined,
    appsIncluded: Array.isArray(row.apps_included) ? row.apps_included.map(String) : undefined,
    setupFeeCents: row.setup_fee_cents || 0,
    catalogGroup: row.catalog_group || 'store',
    stripeProductId: row.stripe_product_id || undefined,
    stripePriceId: row.stripe_price_id || undefined,
    isActive: row.is_active,
  };
}

export interface ProductImage {
  id: string;
  url: string;
  alt_text?: string;
  is_primary: boolean;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  price?: number;
  inventory_quantity: number;
  options: Record<string, string>;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  image?: string;
  parent_id?: string;
  product_count?: number;
}

export interface CartItem {
  id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  price: number;
  total: number;
  product?: Product;
  variant?: ProductVariant;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount_total: number;
  tax_total: number;
  shipping_total: number;
  total: number;
  coupon_code?: string;
  item_count: number;
}

export interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  total: number;
  items: OrderItem[];
  billing_address?: Address;
  shipping_address?: Address;
  created_at: string;
}

export interface OrderItem {
  id: string;
  name: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  total: number;
  image_url?: string;
  is_digital: boolean;
  download_url?: string;
  license_key?: string;
}

export interface Address {
  first_name: string;
  last_name: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
}

export interface SearchResult {
  id: string;
  item_id: string;
  title: string;
  description: string;
  href: string;
  category: string;
  audiences: string[];
  image?: string;
  price?: string;
  badge?: string;
}

export interface StoreCard {
  id: string;
  card_id: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  image: string;
  icon: string;
  tour_id: string;
  tier: 'primary' | 'secondary';
  sort_order: number;
  tour_description: string;
}

export interface PageGuide {
  page_id: string;
  page_name: string;
  avatar_name: string;
  avatar_image: string;
  quick_tips: string[];
  messages: GuideMessage[];
}

export interface GuideMessage {
  message_id: string;
  message_type: string;
  message: string;
  action_label?: string;
  action_href?: string;
  sort_order: number;
}

export interface Recommendation {
  id: string;
  source_product_id: string;
  target_product_id: string;
  recommendation_type: 'upsell' | 'cross-sell' | 'bundle' | 'upgrade';
  reason: string;
  savings?: string;
  product?: Product;
}

// ============================================
// PRODUCTS
// ============================================

export async function getProducts(options?: {
  category?: string;
  audience?: string;
  featured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Product[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('is_featured', { ascending: false });

  if (options?.category) {
    query = query.eq('category', options.category);
  }

  if (options?.audience) {
    query = query.contains('audiences', [options.audience]);
  }

  if (options?.featured) {
    query = query.eq('is_featured', true);
  }

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching products:', error);
    return [];
  }

  return data || [];
}

export async function getProduct(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_images (*),
      product_variants (*)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    logger.error('Error fetching product:', error);
    return null;
  }

  return data;
}

/**
 * Get a product by slug, mapped to the CatalogProduct shape for checkout/store pages.
 * This is the canonical way to look up products — replaces the hardcoded getProductBySlug.
 */
export async function getCatalogProduct(slug: string): Promise<CatalogProduct | null> {
  const product = await getProduct(slug);
  if (!product) return null;
  return toCatalogProduct(product);
}

/**
 * Get all active catalog products, optionally filtered by catalog_group.
 */
export async function getCatalogProducts(group?: 'store' | 'addon' | 'clone'): Promise<CatalogProduct[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (group) {
    query = query.eq('catalog_group', group);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching catalog products:', error);
    return [];
  }

  return (data || []).map(toCatalogProduct);
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .in('id', ids)
    .eq('is_active', true);

  if (error) {
    logger.error('Error fetching products by IDs:', error);
    return [];
  }

  return data || [];
}

// ============================================
// CATEGORIES
// ============================================

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    logger.error('Error fetching categories:', error);
    return [];
  }

  return data || [];
}

export async function getCategory(slug: string): Promise<Category | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    logger.error('Error fetching category:', error);
    return null;
  }

  return data;
}

// ============================================
// CART
// ============================================

export async function getCart(cartId?: string, sessionId?: string): Promise<Cart | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  let query = supabase
    .from('carts')
    .select(`
      *,
      cart_items (
        *,
        product:products (*),
        variant:product_variants (*)
      )
    `);

  if (cartId) {
    query = query.eq('id', cartId);
  } else if (sessionId) {
    query = query.eq('session_id', sessionId);
  } else {
    return null;
  }

  const { data, error } = await query.single();

  if (error) {
    logger.error('Error fetching cart:', error);
    return null;
  }

  return {
    ...data,
    items: data.cart_items || [],
    item_count: data.cart_items?.reduce((sum: number, item: CartItem) => sum + item.quantity, 0) || 0,
  };
}

export async function addToCart(
  cartId: string,
  productId: string,
  quantity: number = 1,
  variantId?: string
): Promise<CartItem | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  // Get product price
  const { data: product } = await supabase
    .from('products')
    .select('price')
    .eq('id', productId)
    .single();

  if (!product) return null;

  const price = product.price;
  const total = price * quantity;

  const { data, error } = await supabase
    .from('cart_items')
    .upsert({
      cart_id: cartId,
      product_id: productId,
      variant_id: variantId,
      quantity,
      price,
      total,
    }, {
      onConflict: 'cart_id,product_id',
    })
    .select()
    .single();

  if (error) {
    logger.error('Error adding to cart:', error);
    return null;
  }

  return data;
}

export async function updateCartItem(
  itemId: string,
  quantity: number
): Promise<CartItem | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: item } = await supabase
    .from('cart_items')
    .select('price')
    .eq('id', itemId)
    .single();

  if (!item) return null;

  const { data, error } = await supabase
    .from('cart_items')
    .update({
      quantity,
      total: item.price * quantity,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    logger.error('Error updating cart item:', error);
    return null;
  }

  return data;
}

export async function removeFromCart(itemId: string): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    logger.error('Error removing from cart:', error);
    return false;
  }

  return true;
}

// ============================================
// ORDERS
// ============================================

export async function getOrders(customerId: string): Promise<Order[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching orders:', error);
    return [];
  }

  return data?.map(order => ({
    ...order,
    items: order.order_items || [],
  })) || [];
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('id', orderId)
    .single();

  if (error) {
    logger.error('Error fetching order:', error);
    return null;
  }

  return {
    ...data,
    items: data.order_items || [],
  };
}

// ============================================
// SEARCH
// ============================================

export async function searchStore(
  query: string,
  audience?: string,
  category?: string,
  limit: number = 10
): Promise<SearchResult[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  let dbQuery = supabase
    .from('search_index')
    .select('*')
    .eq('is_active', true)
    .limit(limit);

  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,keywords.cs.{${query}}`);
  }

  if (audience && audience !== 'everyone') {
    dbQuery = dbQuery.contains('audiences', [audience]);
  }

  if (category) {
    dbQuery = dbQuery.eq('category', category);
  }

  const { data, error } = await dbQuery;

  if (error) {
    logger.error('Error searching:', error);
    return [];
  }

  return data || [];
}

export async function getFeaturedForAudience(
  audience: string,
  limit: number = 6
): Promise<SearchResult[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('search_index')
    .select('*')
    .eq('is_active', true)
    .contains('audiences', [audience])
    .order('sort_order', { ascending: true })
    .limit(limit);

  if (error) {
    logger.error('Error fetching featured:', error);
    return [];
  }

  return data || [];
}

// ============================================
// STORE CARDS
// ============================================

export async function getStoreCards(): Promise<{ primary: StoreCard[]; secondary: StoreCard[] }> {
  const supabase = await createClient();
  if (!supabase) return { primary: [], secondary: [] };

  const { data, error } = await supabase
    .from('store_cards')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    logger.error('Error fetching store cards:', error);
    return { primary: [], secondary: [] };
  }

  const cards = data || [];
  return {
    primary: cards.filter(c => c.tier === 'primary'),
    secondary: cards.filter(c => c.tier === 'secondary'),
  };
}

// ============================================
// PAGE GUIDES
// ============================================

export async function getPageGuide(pageId: string): Promise<PageGuide | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: guide, error: guideError } = await supabase
    .from('page_guides')
    .select('*')
    .eq('page_id', pageId)
    .eq('is_active', true)
    .single();

  if (guideError || !guide) {
    return null;
  }

  const { data: messages, error: messagesError } = await supabase
    .from('guide_messages')
    .select('*')
    .eq('page_id', pageId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (messagesError) {
    logger.error('Error fetching guide messages:', messagesError);
  }

  return {
    ...guide,
    messages: messages || [],
  };
}

// ============================================
// RECOMMENDATIONS
// ============================================

export async function getRecommendations(productId: string): Promise<Recommendation[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('product_recommendations')
    .select(`
      *,
      product:store_products_catalog!target_product_id (*)
    `)
    .eq('source_product_id', productId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    logger.error('Error fetching recommendations:', error);
    return [];
  }

  return data || [];
}

export async function getAvatarSalesMessage(productId: string): Promise<{
  intro: string;
  value_highlight: string;
  objection_handler: string;
  call_to_action: string;
} | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('avatar_sales_messages')
    .select('*')
    .eq('product_id', productId)
    .eq('is_active', true)
    .single();

  if (error) {
    return null;
  }

  return data;
}

// ============================================
// COUPONS
// ============================================

export async function validateCoupon(code: string, cartTotal: number): Promise<{
  valid: boolean;
  discount: number;
  message?: string;
}> {
  const supabase = await createClient();
  if (!supabase) return { valid: false, discount: 0, message: 'Service unavailable' };

  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();

  if (error || !coupon) {
    return { valid: false, discount: 0, message: 'Invalid coupon code' };
  }

  // Check expiration
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, discount: 0, message: 'Coupon has expired' };
  }

  // Check minimum order
  if (coupon.minimum_order_amount && cartTotal < coupon.minimum_order_amount) {
    return { 
      valid: false, 
      discount: 0, 
      message: `Minimum order of $${coupon.minimum_order_amount} required` 
    };
  }

  // Check usage limit
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    return { valid: false, discount: 0, message: 'Coupon usage limit reached' };
  }

  // Calculate discount
  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    discount = cartTotal * (coupon.discount_value / 100);
    if (coupon.maximum_discount) {
      discount = Math.min(discount, coupon.maximum_discount);
    }
  } else if (coupon.discount_type === 'fixed_amount') {
    discount = coupon.discount_value;
  }

  return { valid: true, discount };
}

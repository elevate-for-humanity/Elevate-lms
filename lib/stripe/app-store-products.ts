/**
 * App Store Compliant Pricing Structure
 * For Google Play and Apple App Store
 *
 * IMPORTANT: These prices must match exactly on:
 * - Stripe
 * - Website /pricing page
 * - In-app pricing screen
 * - App store listings
 */

export type AppAccessTier = 'free' | 'student' | 'career' | 'partner';

export interface AppStoreProduct {
  id: string;
  tier: AppAccessTier;
  name: string;
  description: string;
  price: number; // in cents
  priceDisplay: string;
  interval: 'month' | 'one-time' | 'custom';
  features: string[];
  stripePriceId?: string; // To be filled in after Stripe setup
  recommended?: boolean;
}

export const APP_STORE_PRODUCTS: AppStoreProduct[] = [
  {
    id: 'free-access',
    tier: 'free',
    name: 'Free Access',
    description: 'Browse programs and submit inquiries',
    price: 0,
    priceDisplay: '$0',
    interval: 'month',
    features: [
      'Browse programs',
      'Submit inquiries',
      'View public content',
      'No paywall at install',
    ],
    stripePriceId: undefined, // No Stripe needed for free tier
  },
  {
    id: 'student-access',
    tier: 'student',
    name: 'Student Access',
    description: 'Monthly platform access for enrolled learners',
    price: 3900, // $39.00
    priceDisplay: '$39/month',
    interval: 'month',
    features: [
      'LMS access',
      'Assigned courses',
      'Progress tracking',
      'Certificates (non-licensed)',
      'Student dashboard',
      'Course materials',
    ],
    stripePriceId: 'price_1Sree2IRNf5vPH3A3VUGFzkO',
    recommended: true,
  },
  {
    id: 'career-track-access',
    tier: 'career',
    name: 'Career Track Access',
    description: 'Advanced platform access for career pathways and professional tools',
    price: 14900, // $149.00
    priceDisplay: '$149/month',
    interval: 'month',
    features: [
      'Full LMS access',
      'Career track content',
      'Business modules',
      'Professional tools',
      'Priority support',
      'Advanced analytics',
      'Career coaching resources',
    ],
    stripePriceId: 'price_1Sree3IRNf5vPH3Ap8GN1SBP',
  },
  {
    id: 'partner-access',
    tier: 'partner',
    name: 'Partner / Organization',
    description: 'Custom pricing for organizations and partners',
    price: 0, // Custom pricing
    priceDisplay: 'Contact Us',
    interval: 'custom',
    features: [
      'Custom implementation',
      'Multi-user access',
      'White-label options',
      'Dedicated support',
      'Custom integrations',
      'Training for staff',
    ],
    stripePriceId: undefined, // No Stripe - handled via sales
  },
];

/**
 * Get product by tier
 */
export function getProductByTier(tier: AppAccessTier): AppStoreProduct | undefined {
  return APP_STORE_PRODUCTS.find((p) => p.tier === tier);
}

/**
 * Get all paid products (excludes free and custom)
 */
export function getPaidProducts(): AppStoreProduct[] {
  return APP_STORE_PRODUCTS.filter((p) => p.price > 0 && p.interval !== 'custom');
}

/**
 * Check if a tier requires payment
 */
export function requiresPayment(tier: AppAccessTier): boolean {
  const product = getProductByTier(tier);
  return product ? product.price > 0 : false;
}

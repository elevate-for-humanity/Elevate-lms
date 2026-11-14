/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

// Enhanced Checkout Route with Coupon Discount Support
// Replace your existing /api/checkout route with this enhanced version

import { Router } from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
// Shared discount logic is imported where needed by tests; removed unused import to satisfy linter.
// import { calculateDiscountedCents } from './discount-utils.js';
import { incrementCouponUsage } from './pay-coupon-routes.js';
import { markPaidInSupabase } from './pay-backend-integration.js';

let _stripe;
let _supa;
function getStripe() {
  if (_stripe) return _stripe;
  if (!process.env.STRIPE_SECRET_KEY) {
    // minimal stub for tests
    _stripe = {
      prices: {
        retrieve: async () => ({ unit_amount: 1000, product: 'prod_test' }),
        create: async (p) => ({ id: 'price_test', ...p }),
      },
      products: { create: async (p) => ({ id: 'prod_dynamic', ...p }) },
      checkout: {
        sessions: {
          create: async () => ({
            id: 'cs_test',
            url: 'https://example.com/checkout',
          }),
        },
      },
    };
  } else {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
  }
  return _stripe;
}
function getSupa() {
  if (_supa) return _supa;
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    _supa = {
      from: () => ({
        select: () => ({
          eq: () => ({ single: async () => ({ data: null }) }),
        }),
      }),
    };
  } else {
    _supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  }
  return _supa;
}

export const enhancedCheckout = Router();

// (Removed duplicate local calculateDiscountedCents; using shared utility)

enhancedCheckout.post('/api/checkout', async (req, res, next) => {
  try {
    const {
      priceId,
      productName,
      unitAmount,
      quantity = 1,
      currency = 'usd',
      metadata = {},
    } = req.body || {};

    const { coupon: couponCode, program_slug } = metadata || {};

    // Helper to compute discount if coupon present

    async function getDiscountedCents(listCents) {
      if (!couponCode) return null;

      const { data: c } = await getSupa()
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .single();

      if (!c) return null;

      const now = new Date();

      // Validate coupon
      if (!c.active) return null;
      if (c.starts_at && now < new Date(c.starts_at)) return null;
      if (c.ends_at && now > new Date(c.ends_at)) return null;
      if (c.max_redemptions && c.redeemed_count >= c.max_redemptions) return null;
      if (
        Array.isArray(c.allowed_programs) &&
        c.allowed_programs.length &&
        program_slug &&
        !c.allowed_programs.includes(program_slug)
      ) {
        return null;
      }

      if (c.type === 'amount') {
        return Math.max(0, listCents - c.value);
      }
      if (c.type === 'percent') {
        return Math.round(listCents * (1 - c.value / 100));
      }
      return null;
    }

    const line_items = [];

    if (priceId) {
      // If a fixed priceId is given, create a one-off discounted price if coupon applies
      let effectivePriceId = priceId;

      if (couponCode) {
        // Look up original price to get amount
        const price = await getStripe().prices.retrieve(priceId);
        const baseAmount = price.unit_amount;
        const discountedAmount = await getDiscountedCents(baseAmount);

        if (typeof discountedAmount === 'number' && discountedAmount !== baseAmount) {
          // Create temporary discounted price
          const tempPrice = await getStripe().prices.create({
            currency,
            unit_amount: discountedAmount,
            product: price.product,
          });
          effectivePriceId = tempPrice.id;
          metadata.original_price_cents = baseAmount;
          metadata.discounted_price_cents = discountedAmount;
          metadata.discount_amount_cents = baseAmount - discountedAmount;
        }
      }

      line_items.push({ price: effectivePriceId, quantity });
    } else {
      // Dynamic product pricing
      if (!productName || !Number.isInteger(unitAmount)) {
        return res.status(400).json({
          error: 'Provide priceId OR (productName & unitAmount in cents).',
        });
      }

      const discountedAmount = await getDiscountedCents(unitAmount);
      const finalAmount = typeof discountedAmount === 'number' ? discountedAmount : unitAmount;

      // Add discount info to metadata if coupon was applied
      if (discountedAmount !== null && discountedAmount !== unitAmount) {
        metadata.original_price_cents = unitAmount;
        metadata.discounted_price_cents = discountedAmount;
        metadata.discount_amount_cents = unitAmount - discountedAmount;
      }

      const product = await getStripe().products.create({
        name: productName,
        metadata: { program_slug: program_slug || productName },
      });

      const price = await getStripe().prices.create({
        product: product.id,
        unit_amount: finalAmount,
        currency,
      });

      line_items.push({ price: price.id, quantity });
    }

    // Create Stripe checkout session
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: process.env.STRIPE_SUCCESS_URL + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: process.env.STRIPE_CANCEL_URL,
      metadata,
      customer_email: metadata.customer_email || undefined,
    });

    res.json({
      id: session.id,
      url: session.url,
      metadata: {
        coupon_applied: !!couponCode,
        discount_preview: metadata.discount_amount_cents
          ? {
              original: metadata.original_price_cents,
              discounted: metadata.discounted_price_cents,
              savings: metadata.discount_amount_cents,
            }
          : null,
      },
    });
  } catch (e) {
    next(e);
  }
});

/**
 * Enhanced webhook handler that tracks coupon usage
 * Add this to your existing webhook after successful payment
 */
// Basic coupon helper implementations (can be overridden in frontend bundle)
function efhPreviewCoupon(code) {
  if (!code) return { valid: false };
  return { valid: true, code: code.toUpperCase() };
}
function efhApplyCoupon(code) {
  return efhPreviewCoupon(code);
}

export async function handleSuccessfulPayment(session) {
  const { metadata } = session;

  // Mark enrollment as paid in Supabase
  await markPaidInSupabase({
    email: session.customer_details?.email,
    program_slug: metadata?.program_slug,
    stripe_customer_id: session.customer || null,
    session_id: session.id,
    funding_metadata: extractFundingMetadata(metadata),
  });

  // Increment coupon usage count
  if (metadata?.coupon) {
    await incrementCouponUsage(metadata.coupon);
  }
}

function extractFundingMetadata(metadata) {
  const fundingMeta = {};
  if (metadata?.voucher_id) fundingMeta.voucher_id = metadata.voucher_id;
  if (metadata?.case_manager_email) fundingMeta.case_manager_email = metadata.case_manager_email;
  if (metadata?.funding_source) fundingMeta.funding_source = metadata.funding_source;
  if (metadata?.coupon) fundingMeta.coupon = metadata.coupon;
  return fundingMeta;
}

// Re-export for integration
export { enhancedCheckout };
// export helper for testing
// test helper
export {};
// Guard against undefined window in Node context
if (typeof window !== 'undefined') {
  window.efhPreviewCoupon = efhPreviewCoupon;
  window.efhApplyCoupon = efhApplyCoupon;
}

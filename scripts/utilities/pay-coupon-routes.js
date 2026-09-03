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

// Coupon Validation Routes for Pay Backend
// Add this to your existing Pay service routes

import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
export const coupons = Router();

/**
 * Validate a coupon for a program.
 * POST /api/coupons/validate
 * Body: { code, program_slug, list_price_cents? }
 * Returns: { valid, reason?, discounted_cents?, type?, value? }
 */
coupons.post('/api/coupons/validate', async (req, res) => {
  try {
    const { code = '', program_slug = '', list_price_cents } = req.body || {};
    if (!code || !program_slug) {
      return res.status(400).json({ valid: false, reason: 'Missing code or program_slug' });
    }

    const { data: c } = await supa
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (!c) {
      return res.json({ valid: false, reason: 'Invalid code' });
    }

    const now = new Date();

    // Check if coupon is active
    if (!c.active) {
      return res.json({ valid: false, reason: 'Inactive' });
    }

    // Check date range
    if (c.starts_at && now < new Date(c.starts_at)) {
      return res.json({ valid: false, reason: 'Not started' });
    }
    if (c.ends_at && now > new Date(c.ends_at)) {
      return res.json({ valid: false, reason: 'Expired' });
    }

    // Check redemption limit
    if (c.max_redemptions && c.redeemed_count >= c.max_redemptions) {
      return res.json({ valid: false, reason: 'Redemption limit reached' });
    }

    // Check program eligibility
    if (
      Array.isArray(c.allowed_programs) &&
      c.allowed_programs.length &&
      !c.allowed_programs.includes(program_slug)
    ) {
      return res.json({
        valid: false,
        reason: 'Not eligible for this program',
      });
    }

    let discounted_cents = undefined;
    if (typeof list_price_cents === 'number') {
      if (c.type === 'amount') {
        discounted_cents = Math.max(0, list_price_cents - c.value);
      } else if (c.type === 'percent') {
        discounted_cents = Math.round(list_price_cents * (1 - c.value / 100));
      }
    }

    res.json({
      valid: true,
      type: c.type,
      value: c.value,
      discounted_cents,
    });
  } catch (e) {
    res.status(500).json({ valid: false, reason: e.message });
  }
});

/**
 * Mark coupon as used (called from webhook after successful payment)
 * Internal use only
 */
export async function incrementCouponUsage(couponCode) {
  try {
    if (!couponCode) return;

    const { data: coupon } = await supa
      .from('coupons')
      .select('id, redeemed_count')
      .eq('code', couponCode.toUpperCase())
      .single();

    if (coupon) {
      await supa
        .from('coupons')
        .update({ redeemed_count: (coupon.redeemed_count || 0) + 1 })
        .eq('id', coupon.id);
    }
  } catch (e) {}
}

// Client-side helper function (for frontend reference)
export const couponClientCode = `
// Frontend helper - preview coupon discount
async function previewCoupon(code, slug, listCents) {
  const r = await fetch('https://pay.elevateforhumanity.org/api/coupons/validate', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ code, program_slug: slug, list_price_cents: listCents })
  });
  return r.json(); // {valid, discounted_cents, type, value, reason}
}
`;

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

// Enhanced Checkout with Coupon Validation
// Include this script on sister sites to add real-time coupon validation
//
// Note: This file also serves as the main entry point for Node.js deployment
// When running in Node.js environment, it starts the actual server

// Check if running in Node.js environment (server-side)
if (typeof window === 'undefined' && typeof require !== 'undefined') {
    '🔧 Entry point detected: Starting server from enhanced-checkout-with-coupons.js'
  );
    '🔄 Redirecting to simple-server.js for proper server initialization'
  );

  try {
    // Start the actual server
    require('./server.js');
  } catch (error) {
    process.exit(1);
  }

  // If we reach here, the server module loaded successfully

  // Exit this script since the server is now running
  return;
}

// Configure program prices (in cents)
const EFH_PRICES = {
  business: 495000, // $4,950.00
  'cpr-ems': 12500, // $125.00
  'building-tech': 295000, // $2,950.00
};

/**
 * Preview coupon discount for a program
 * @param {string} slug - Program slug
 * @param {string} code - Coupon code
 * @returns {Promise} - {valid, discounted_cents, type, value, reason}
 */
async function efhPreviewCoupon(slug, code) {
  const PAY_API = window.PAY_API || 'https://pay.elevateforhumanity.org';

  try {
    const r = await fetch(`${PAY_API}/api/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        program_slug: slug,
        list_price_cents: EFH_PRICES[slug],
      }),
    });
    return await r.json();
  } catch (e) {
    return { valid: false, reason: 'Network error' };
  }
}

/**
 * Apply coupon to a specific program card
 * @param {string} slug - Program slug
 */
async function efhApplyCoupon(slug) {
  const code = (document.getElementById(`cp_${slug}`)?.value || '').trim();
  const out = document.getElementById(`cpout_${slug}`);

  if (!out) return;

  if (!code) {
    out.textContent = 'Enter a coupon code.';
    return;
  }

  out.textContent = 'Checking…';

  const res = await efhPreviewCoupon(slug, code);

  if (!res.valid) {
    out.textContent = `❌ ${res.reason || 'Invalid coupon'}`;
    return;
  }

  const listPrice = EFH_PRICES[slug];
  const discount = listPrice - res.discounted_cents;
  const savings = (discount / 100).toFixed(2);
  const newPrice = (res.discounted_cents / 100).toFixed(2);

  // Create safe DOM elements instead of using innerHTML
  out.textContent = ''; // Clear existing content

  const checkmark = document.createTextNode('✅ ');
  const strongEl = document.createElement('strong');
  const restText = document.createTextNode(
    ` — Save $${savings} (New price: $${newPrice})`
  );

  if (res.type === 'percent') {
    strongEl.textContent = `${res.value}% off`;
  } else {
    strongEl.textContent = `$${(res.value / 100).toFixed(2)} off`;
  }

  out.appendChild(checkmark);
  out.appendChild(strongEl);
  out.appendChild(restText);

  // Update the enrollment button to use discounted price
  const enrollBtn = document.querySelector(
    `[data-program="${slug}"] .enroll-btn`
  );
  if (enrollBtn) {
    const originalText =
      enrollBtn.dataset.originalText || enrollBtn.textContent;
    if (!enrollBtn.dataset.originalText) {
      enrollBtn.dataset.originalText = originalText;
    }
    enrollBtn.textContent = `${originalText} - $${newPrice}`;
  }
}

/**
 * Add coupon field to program cards
 * Call this function after your program cards are rendered
 * @param {string} containerId - ID of container with program cards
 */
function efhAddCouponFields(containerId = 'programs') {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Find all program cards (assumes they have data-program attribute)
  const cards = container.querySelectorAll('[data-program]');

  cards.forEach((card) => {
    const slug = card.dataset.program;
    if (!slug || !EFH_PRICES[slug]) return;

    const existingCoupon = card.querySelector('.coupon-field');
    if (existingCoupon) return; // Already added

    const couponHTML = `
      <div class="coupon-field" style="margin-top:12px;padding:12px;border:1px solid #ddd;border-radius:8px;background:#f9f9f9">
        <label style="display:block;font-weight:600;margin-bottom:6px">Have a coupon?</label>
        <div style="display:flex;gap:8px">
          <input id="cp_${slug}" type="text" placeholder="Enter code"
                 style="flex:1;padding:8px;border:1px solid #ccc;border-radius:4px"/>
          <button onclick="efhApplyCoupon('${slug}')"
                  style="padding:8px 12px;background:#007bff;color:white;border:none;border-radius:4px;cursor:pointer">
            Apply
          </button>
        </div>
        <div id="cpout_${slug}" style="margin-top:8px;font-size:14px;color:#666"></div>
      </div>
    `;

    card.insertAdjacentHTML('beforeend', couponHTML);
  });
}

/**
 * Enhanced enrollment function with coupon support
 * Automatically applies coupon discount if user entered one
 */
async function efhEnrollWithCoupon({
  programName,
  programSlug,
  priceId = '',
  amountUSD = 0,
  metadata = {},
}) {
  // Get funding info (if Account Drawer is loaded)
  const f = window.efhFunding?.get() || {};
  const fundingMeta = {};
  if (f.voucher_id) fundingMeta.voucher_id = f.voucher_id;
  if (f.case_manager_email)
    fundingMeta.case_manager_email = f.case_manager_email;
  if (f.funding_source) fundingMeta.funding_source = f.funding_source;
  if (f.coupon) fundingMeta.coupon = f.coupon;

  // Check for coupon entered on this specific program card
  const couponField = document.getElementById(`cp_${programSlug}`);
  const couponCode = couponField?.value?.trim();
  if (couponCode) {
    fundingMeta.coupon = couponCode;
  }

  const mergedMeta = {
    ...metadata,
    ...fundingMeta,
    program_slug: programSlug,
  };

  const PAY_API =
    window.PAY_API || 'https://pay.elevateforhumanity.org/api/checkout';

  const body = priceId
    ? { priceId, quantity: 1, metadata: mergedMeta }
    : {
        productName: programName,
        unitAmount: Math.round(amountUSD * 100),
        currency: 'usd',
        quantity: 1,
        metadata: mergedMeta,
      };

  try {
    const res = await fetch(PAY_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data?.url) {
      window.location.href = data.url;
    } else {
      alert(data?.error || 'Checkout failed');
    }
  } catch (e) {
    alert('Network error during checkout');
  }
}

// Make functions globally available
window.efhPreviewCoupon = efhPreviewCoupon;
window.efhApplyCoupon = efhApplyCoupon;
window.efhAddCouponFields = efhAddCouponFields;
window.efhEnrollWithCoupon = efhEnrollWithCoupon;
window.EFH_PRICES = EFH_PRICES;

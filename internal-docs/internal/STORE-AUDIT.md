# Store Audit Report

**Date:** January 19, 2025

## Overview

The store section (`/store`) has multiple product types and checkout flows. This audit identifies issues and inconsistencies.

---

## Store Structure

```
/store
├── page.tsx              ✅ Main landing - well designed
├── courses/              ✅ Certification courses
├── licenses/             ✅ Platform licenses (Starter/Pro/Enterprise)
├── digital/              ✅ Digital products
├── cart/                 ⚠️ Uses cart_items table (doesn't exist)
├── checkout/             ✅ Fixed - now uses Stripe redirect
│   └── [slug]/           ✅ Uses Stripe Elements (PCI compliant)
├── success/              ✅ Success page
├── orders/               ⚠️ Needs verification
└── subscriptions/        ⚠️ Needs verification
```

---

## Issues Found

### 🔴 Critical

#### 1. Missing `cart_items` Table
- **Location:** `/store/checkout/page.tsx`, `/store/cart/page.tsx`
- **Issue:** Code queries `cart_items` table which doesn't exist in migrations
- **Impact:** Cart functionality will fail
- **Fix:** Either create the table or remove cart functionality

#### 2. Table Name Mismatch
- **Issue:** Multiple product tables exist:
  - `shop_products` (current migration)
  - `store_products` (archived)
  - `products` (archived)
  - `marketplace_products` (archived)
- **Impact:** Queries may fail or return no data
- **Fix:** Standardize on one table name

### 🟠 High Priority

#### 3. Checkout Page References Wrong API
- **Location:** `/store/checkout/page.tsx` (FIXED)
- **Issue:** Was collecting raw card data (PCI violation)
- **Status:** ✅ Fixed - now redirects to Stripe Checkout

#### 4. Missing Cart Checkout API
- **Location:** `/api/store/cart-checkout/`
- **Status:** ✅ Created - handles multi-item cart checkout

### 🟡 Medium Priority

#### 5. Course Data vs Database
- **Issue:** Courses use static data file (`app/data/courses.ts`) not database
- **Impact:** No dynamic course management
- **Recommendation:** Keep static for now, migrate later if needed

#### 6. License Products Use Static Data
- **Issue:** Platform licenses use `app/data/store-products.ts`
- **Impact:** Prices/features can't be changed without deploy
- **Recommendation:** Acceptable for now

---

## Data Sources

| Product Type | Data Source | Stripe Integration |
|--------------|-------------|-------------------|
| Platform Licenses | `store-products.ts` | ✅ Via price map |
| Courses | `courses.ts` | ✅ Via price map |
| Digital Products | `digital-products.ts` | ✅ Payment Intent |
| Shop Products | `shop_products` table | ⚠️ Needs setup |

---

## Stripe Integration Status

| Endpoint | Status | Notes |
|----------|--------|-------|
| `/api/stripe/checkout` | ✅ Working | Handles license purchases |
| `/api/store/checkout` | ✅ Working | Handles product purchases |
| `/api/store/cart-checkout` | ✅ Created | Handles cart checkout |
| `/api/store/create-payment-intent` | ✅ Exists | For Elements flow |
| `/api/webhooks/stripe` | ✅ Exists | Handles events |

---

## Recommendations

### Immediate (Before Launch)
1. Decide: Keep cart functionality or remove it
2. If keeping cart: Create `cart_items` migration
3. Verify all Stripe price IDs are configured

### Short-term
1. Standardize product table naming
2. Add order history functionality
3. Test full purchase flow end-to-end

### Long-term
1. Consider migrating static product data to database
2. Add inventory management for physical products
3. Implement subscription management UI

---

## Files Modified in This Audit

1. `/app/store/checkout/page.tsx` - Removed raw card inputs, now uses Stripe redirect
2. `/app/api/store/cart-checkout/route.ts` - Created for multi-item cart checkout

---

*This audit is part of the 30-day scope freeze. Only critical fixes should be made.*

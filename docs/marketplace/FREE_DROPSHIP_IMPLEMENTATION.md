# Elevate Marketplace — implementation contract (October 9, 2026)

## Non-negotiable requirements
- Use the existing Elevate storefront, Google Cloud deployment, Supabase, and QuickBooks/PayPal arrangements. No Northflank or Stripe reintroduction.
- Supplier accounts must have **no mandatory monthly fee, setup fee, or paid integration tier** for required features. A free trial is not sufficient.
- No inventory purchasing or manual fulfillment. Every physical-product listing must have a supported automated third-party fulfillment path, or remain unpublished.
- Retail-margin suppliers and supplier-paid commission/affiliate programs are distinct. Affiliate items link to supplier checkout; never imply Elevate processes their payments.
- Supplier product photos must show the actual SKU and variants. Licensed Envato assets are **only for site heroes, category banners and editorial imagery**. Record licensing evidence before publication.
- Do not publish unverified prices, stock, shipping times, commission rates, or supplier integrations.
- No supplier fulfillment before verified paid status. Never treat invoice creation or a checkout redirect as payment.
- Support shipping rates, tax determination, refunds, disputes, order idempotency, retry-safe fulfillment and tracking synchronization.
- Keep supplier API keys server-side in Secret Manager; no secrets in GitHub, browser or client bundles.
- Use accessible, mobile-responsive layouts and link categories from Barber & Beauty Network and Employer & Business Owner Network.
- Do not send promotional emails until a successful production checkout-to-fulfillment test; use existing admin communications hub and honor opt-outs.

## Confirmed repository findings (source code, not production verification)
- `components/store/StoreCartView.tsx` contains the cart UI.
- `apps/marketing/app/api/store/cart-checkout/route.ts` creates a pending store order and a QuickBooks invoice, requiring a payment URL.
- The checkout route validates server-side product pricing and requires a shipping address for physical products.
- `STORE_MARKETPLACE_AUDIT.md` explicitly marks physical products **not implemented**; other audit claims about Stripe are historical and must not override current QuickBooks policy.

## Delivery stages / acceptance
1. Inventory the live store, canonical product schema, checkout and payment-confirmation callback, existing network links and deployment status.
2. Verify supplier free-tier terms and **custom storefront** API rights from official docs; obtain authorized account credentials. Reject suppliers requiring paid automation or manual negotiation.
3. Implement supplier adapters with normalized catalog, SKU/variant mapping, supplier-cost and shipping data, inventory refresh, price floors, and image provenance. Stage products unpublished.
4. Build premium storefront category pages with Envato-licensed editorial imagery; actual product photographs come from supplier feeds.
5. Add physical-product checkout including shipping/tax quotes; reconcile QuickBooks paid status server-side before placing idempotent supplier orders.
6. Persist supplier order IDs, shipment tracking, failure states, returns and refund handling; provide admin operational views.
7. Test sandbox and one authorized real order end to end; deploy to Google Cloud only after checks pass.
8. Once verified, notify host shops and apprentices via communications hub with role-specific links and opt-out compliance.

## Release gate
No claims of live fulfillment, supplier registration, Envato download, or QuickBooks payment verification until there is recorded execution evidence.

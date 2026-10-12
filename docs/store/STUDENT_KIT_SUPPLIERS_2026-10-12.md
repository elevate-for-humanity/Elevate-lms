# Student kit supplier verification — October 12, 2026

User requirements: free setup accounts; no subscription requirement or negotiation; Elevate sets retail prices; supplier ships directly to each student. Catalog must cover barber, cosmetology, esthetics and nail kits, replacement tools and consumable supplies. Research is not account activation. No supplier account was created in this session and no fulfillment integration is live.

| Supplier | Relevant catalog | Account cost evidence | Direct student fulfillment | Decision |
|---|---|---|---|---|
| CJdropshipping | Hair clippers, beauty tools, makeup brushes and grooming kits | Official basic service pages state no registration/monthly fee; product/shipping and optional services remain payable | Dropshipping service; stock, delivery to Indiana, kit completeness and professional suitability must be checked per SKU | Free-account candidate for individual tools; complete professional student kit not verified |
| ProStylingTools | Professional barber/beauty tools, hair care, skincare and supplies | Official wholesale page explicitly states free account, no enrollment/annual fee, no buying minimum | FAQ's "Drop Ship" label means manufacturer-to-buyer shipping; it does not by itself prove an Elevate reseller fulfillment agreement | Free wholesale candidate; reseller-direct fulfillment and feed access unverified |
| FragranceX | Aftershave, body care, cologne and fragrance | Official dropship page states no hidden fees/minimums to register | Official service offers unbranded direct-to-customer shipments after account approval | Supplementary supply candidate, not a student-kit supplier |
| Printful | Branded apparel/accessories | Official free plan has no setup/monthly fee | Print-on-demand fulfillment | Optional uniforms; not a student-kit supplier |
| Beauty Kit Solutions | Ready-made barber, cosmetology, esthetics and manicure kits | Wholesale application requires first order over $400, resale certificate and owner ID | Blind dropshipping not established by public documentation | Does not satisfy the no-upfront-purchase path; do not sign up or buy |
| Charlene Products | Standard school kits for barber/cosmetology/nails/esthetics, mannequins, capes | Wholesale prices are quote-based | Student-kit shipping available; reseller drop shipping unverified | Excluded from no-negotiation route |
| Burmax | Barber/cosmetology/esthetics/nail student kits | Free self-service reseller setup not established | Some items marked drop ship; student-direct reseller program unverified | Investigated; not approved as a qualifying supplier |
| My Beauty Site | Beauty supplies and dropship platform | Current membership page lists $299/year; "free setup" promotion is not evidence of a free ongoing account | Offers dropshipping | Excluded from free-only route unless a genuinely free plan is documented |
| GreenDropShip | Hair/body/beauty care | Official membership levels list annual paid membership | Offers dropshipping | Excluded from free-only route |

## Verified official sources

- https://www.cjdropshipping.com/blogs/cj-news/CJdropshipping-vs-AutoDS
- https://prostylingtools.com/pages/wholesale
- https://prostylingtools.com/pages/faq
- https://www.fragrancex.com/customerservice/perfume_drop_ship.html
- https://www.fragrancex.com/customerservice/business_wholesale.html
- https://help.printful.com/hc/en-us/articles/50261163157905-How-much-does-Printful-cost
- https://www.beautykitsolutions.com/school-student-kits/
- https://www.beautykitsolutions.com/service/apply-for-a-wholesale-account/
- https://charleneproducts.com/pages/for-schools
- https://charleneproducts.com/pages/wholesale
- https://www.burmax.com/catalog/student-kits
- https://mybeautysite.com/pages/pricing
- https://greendropship.com/membership-account/membership-levels/

## Import and fulfillment release requirements

Before offering a kit for payment, match its actual contents to the relevant program's supply list. Keep supplier SKU/variant, verified inventory, product photos and usage permission, landed cost, Elevate retail price, destination shipping quote, return policy and fulfillment method together. Wholesale account creation does not establish a product feed or automatic shipping.

Existing `lib/store/products.ts` has a $420 barber kit marked out of stock with a generic image. No supplier identity, supplier SKU, shipping quote or supplier order integration is attached to that record. Do not turn it on without the actual catalog and fulfillment mapping.

The existing vendor payout modules serve platform vendors; they are not a dropship order processor. A supplier purchase and its tracking must be reconciled to each paid customer order with duplicate-order protection. No orders or purchases were submitted during this audit.

## Account setup boundary observed

The browser authentication capability explicitly prohibits automated new-account creation and requires manual signup handoff. FragranceX registration additionally needs address, contact email and new password and says approval takes 2–3 business days. No credentials were entered or exposed. This is a concrete tooling limit, not a requirement to negotiate supplier terms.

CJdropshipping browser access also returned a human-verification screen on the official site and remained blocked after one reload. No challenge was attempted or bypassed. Product research used public official sources only.

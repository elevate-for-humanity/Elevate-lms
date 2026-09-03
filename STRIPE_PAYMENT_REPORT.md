# Stripe Payment Report - June 16, 2026

## ACCOUNT BALANCE
- **Available:** $9.47 USD
- **Pending:** $73.89 USD

---

## JORDAN WHITE (Jbwhite888@icloud.com)
**Customer ID:** cus_UGFxoJKjtlNoy8

### Payments Summary
| Date | Amount | Status | Notes |
|------|--------|--------|-------|
| 2026-06-15 | $76.41 | ✓ SUCCEEDED | Subscription |
| 2026-06-15 | $76.41 | ✗ FAILED | |
| 2026-06-08 | $76.41 | ✓ SUCCEEDED | |
| 2026-06-02 | $76.41 | ✓ SUCCEEDED | |
| 2026-05-26 | $76.41 | ✓ SUCCEEDED | |
| 2026-05-19 | $76.41 | ✓ SUCCEEDED | (multiple charges) |
| Multiple dates | $76.41 | ✗ FAILED | Many failed attempts |

**Total Paid:** $534.87

### Subscriptions
| Status | Amount | Subscription ID |
|--------|--------|-----------------|
| ACTIVE | $76.41/mo | sub_1TiizhH4a2yrVOt54XY9cEmf |
| PAST_DUE | $76.41/mo | sub_1Tg1lRH4a2yrVOt5hc7e4eGd |
| ACTIVE | $76.41/mo | sub_1TddvJH4a2yrVOt5CPk5qWwX |

**⚠️ ISSUE:** Has multiple subscriptions (should only have 1 active)

---

## NATALIA ROA (nataTaroa@gmail.com)
**Customer ID:** cus_UTVa6pmsYlWBsp

### Payments Summary
| Date | Amount | Status | Notes |
|------|--------|--------|-------|
| 2026-06-02 | $151.03 | ✓ SUCCEEDED | |
| 2026-06-01 | $151.03 | ✓ SUCCEEDED | |
| 2026-05-26 | $151.03 | ✓ SUCCEEDED | |
| 2026-05-19 | $151.03 | ✓ SUCCEEDED | |
| 2026-05-12 | $151.03 | ✓ SUCCEEDED | |
| 2026-05-07 | $600.00 | ✓ SUCCEEDED | One-time |
| 2026-05-07 | $600.00 | ✗ FAILED | One-time |
| Multiple dates | $151.03 | ✗ FAILED | Recent failed charges |

**Total Paid:** $1,355.15

### Subscriptions
| Status | Amount | Subscription ID |
|--------|--------|-----------------|
| ACTIVE | $151.03/mo | sub_1TiizwH4a2yrVOt5NVcCV61S |
| PAST_DUE | $151.03/mo | sub_1TWEYsH4a2yrVOt5Exh1HdQG |

**⚠️ ISSUE:** Has duplicate subscriptions, multiple failed charges suggest double-charging issue

### DUPLICATE CHARGES DETECTED
| Date | Attempts | Status |
|------|----------|--------|
| 2026-06-15 | 2 charges | 1 failed, 1 unknown |
| 2026-06-09 to 06-16 | Multiple | All failed |

---

## MERCEDES
- **Status:** Paying cash (not via Stripe)
- **Notes:** Payment links should be available in apprentice dashboard

---

## STRIPE PAYMENT LINKS
**Total:** 20 payment links configured

Active links (should be assigned to programs):
- https://buy.stripe.com/9B628r7badnoeoza7vgIo11
- https://buy.stripe.com/00w8wP676bfg1BNa7vgIo10
- https://buy.stripe.com/fZu7sL1QQfvw5S37ZngIo0Z
- https://buy.stripe.com/28E5kD7ba834fsD4NbgIo0Y
- https://buy.stripe.com/fZucN5cvu1EG1BN0wVgIo0X
- https://buy.stripe.com/bJefZh3YYdno94fbbzgIo0W
- And 14 more...

---

## ISSUES TO FIX

### 1. Jordan White
- [ ] Cancel duplicate subscriptions (keep only 1 active)
- [ ] Review failed payment attempts
- [ ] Ensure only 1 subscription is active

### 2. Natalia Roa  
- [ ] **URGENT:** Investigate potential double-charging
- [ ] Cancel duplicate past_due subscription
- [ ] Review failed payment attempts
- [ ] Send updated payment link

### 3. Mercedes
- [ ] Create Stripe payment link for Mercedes
- [ ] Add to apprentice dashboard
- [ ] Track cash payments in system

### 4. General
- [ ] Set up proper webhook for payment confirmations
- [ ] Create payment links for all programs (barber, cosmetology, nails, esthetics)
- [ ] Add payment links to apprentice dashboard
- [ ] Configure Northflank with Stripe webhook endpoint

---

## RECOMMENDED ACTIONS

1. **Cancel duplicate subscriptions** in Stripe dashboard
2. **Refund any accidental duplicate charges** to Natalia
3. **Create payment links** for each program tier
4. **Add to Northflank** as environment variables
5. **Update apprentice dashboard** to show available payment links
6. **Set up webhook** for real-time payment notifications

---

## NORTHFLANK INTEGRATION

### Stripe Webhook Endpoint Needed
The Northflank deployment needs to be configured to receive Stripe webhooks:

1. Get webhook signing secret from Stripe dashboard
2. Add to Northflank: `STRIPE_WEBHOOK_SECRET=<STRIPE_WEBHOOK_SECRET>`
3. Configure endpoint: `https://your-northflank-url/api/webhooks/stripe`

### Environment Variables Needed in Northflank
```
STRIPE_SECRET_KEY=<STRIPE_SECRET_KEY>
STRIPE_WEBHOOK_SECRET=<STRIPE_WEBHOOK_SECRET>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

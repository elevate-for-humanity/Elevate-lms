# Application Fee Policy

**Date:** 2026-06-23  
**Status:** DOCUMENTED - Implementation Required

---

## APPLICATION FEE SUMMARY

| Program Type | Application Fee | Notes |
|--------------|-----------------|-------|
| **Funded Programs** | $15 | Required |
| **Self-Pay Programs** | $15 | Required |
| **Host Shop Applications** | $15 | Required |
| **Apprenticeship Applications** | $0 | **NO FEE** |

---

## APPLICATION WORKFLOWS

### FUNDED PROGRAMS
```
1. Complete Application
2. Pay $15 Application Fee
3. Submit Documents
4. Funding Review
5. Enrollment
```

### SELF-PAY PROGRAMS
```
1. Complete Application
2. Pay $15 Application Fee
3. Acceptance Review
4. Checkout / BNPL / Payment Plan
5. Enrollment
```

### HOST SHOPS
```
1. Complete Host Shop Application
2. Pay $15 Application Fee
3. Business Verification
4. Site Review
5. Approval
6. Activation
```

### APPRENTICESHIPS
```
1. Complete Apprenticeship Application
2. Eligibility Review
3. Interview / Screening
4. Employer Match
5. Enrollment

Application Fee = $0
```

---

## COUPON RULES

### 50% OFF Promotion

**APPLIES ONLY TO:**
- Self-Pay Programs

**DOES NOT APPLY TO:**
- ❌ Apprenticeships
- ❌ Host Shops
- ❌ Funded Programs
- ❌ Workforce-funded enrollments
- ❌ VR-funded enrollments
- ❌ WIOA-funded enrollments
- ❌ WRG-funded enrollments

---

## CURRENT IMPLEMENTATION

### Application Fee API
```typescript
// apps/app/api/application-fee/checkout/route.ts
const APPLICATION_FEE_PRICE_ID = 'price_1TiEDyH4a2yrVOt5pYBCQc2D';
const APPLICATION_FEE_AMOUNT_CENTS = 1500; // $15
```

### Fields Tracked
```typescript
application_fee_paid: boolean
application_fee_paid_at: timestamp
application_fee_session_id: string
```

---

## ADMIN SETTINGS REQUIRED

Make configurable in admin:
- [ ] Application Fee Amount (Default $15)
- [ ] Program Fee Rules
- [ ] Host Shop Fee Rules
- [ ] Apprenticeship Fee Rules
- [ ] Coupon Rules (Self-Pay only)
- [ ] Stripe Product Mapping

---

## SUCCESS CRITERIA

| Requirement | Status |
|-------------|--------|
| Programs require $15 application fee | ⏳ |
| Host Shops require $15 application fee | ⏳ |
| Apprenticeships do NOT require application fee | ⏳ |
| Self-pay coupon system only applies to self-pay | ⏳ |
| All fees tracked through Stripe | ⏳ |
| Fees visible in reporting dashboards | ⏳ |

---

## CLEAR SEPARATION

| Type | Application Fee |
|------|----------------|
| **Programs** | $15 |
| **Host Shops** | $15 |
| **Apprenticeships** | $0 |

---

## IMPLEMENTATION CHECKLIST

- [ ] Verify $15 fee applies to all programs (not apprenticeships)
- [ ] Verify $15 fee applies to host shop applications
- [ ] Verify NO fee for apprenticeship applications
- [ ] Verify coupon 50% off only works for self-pay
- [ ] Update Stripe webhook to track fee type
- [ ] Add admin settings for fee amounts
- [ ] Update enrollment flow based on program type
- [ ] Test funded program enrollment flow
- [ ] Test self-pay program enrollment flow
- [ ] Test host shop application flow
- [ ] Test apprenticeship enrollment flow
- [ ] Verify fee tracking in reports

---

## NOTES

- Apprenticeship programs should bypass application fee entirely
- Coupon codes should be restricted to self-pay programs only
- Fee tracking should distinguish between program types
- Host shop fees should be separate from program fees

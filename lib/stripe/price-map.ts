// Stripe Price ID Mapping
// Maps store product IDs to Stripe Price IDs
// Uses centralized PRICES config (lib/stripe/prices.ts) instead of individual env vars

import { PRICES } from './prices';

export const STRIPE_PRICE_IDS: Record<string, string> = {
  // Capital Readiness Guide Products
  "capital-readiness-guide": PRICES.CR_GUIDE || "price_1T1yGkIRNf5vPH3ALVeVuavY",
  "capital-readiness-enterprise": PRICES.CR_ENTERPRISE || "price_1T1yGlIRNf5vPH3AdNlMlLAx",
  
  // Platform Licenses
  "efh-core": PRICES.CORE_ONETIME,
  "efh-core-3month": PRICES.CORE_3MONTH,
  "efh-core-6month": PRICES.CORE_6MONTH,
  "efh-core-12month": PRICES.CORE_12MONTH,
  "efh-school-license": PRICES.SCHOOL,
  "efh-enterprise": PRICES.ENTERPRISE,
  
  // Subscription Plans
  "starter_monthly": PRICES.STARTER_MONTHLY,
  "starter_annual": PRICES.STARTER_ANNUAL,
  "professional_monthly": PRICES.PROFESSIONAL_MONTHLY,
  "professional_annual": PRICES.PROFESSIONAL_ANNUAL,
  
  // Healthcare Courses
  "cna-certification": PRICES.CNA,
  "phlebotomy-certification": PRICES.PHLEBOTOMY,
  "medical-assistant": PRICES.MEDICAL_ASSISTANT,
  
  // Skilled Trades Courses
  "cdl-training": PRICES.CDL,
  "hvac-certification": PRICES.HVAC,
  "welding-certification": PRICES.WELDING,
  "electrical-fundamentals": PRICES.ELECTRICAL,
  "plumbing-basics": PRICES.PLUMBING,
  
  // Professional Services Courses
  "barber-license": PRICES.BARBER,
  "cosmetology-license": PRICES.COSMETOLOGY,
  "tax-preparation": PRICES.TAX_PREP,
  "tax-prep-financial-services": "price_1SzM1VIRNf5vPH3APvgSpKRU", // $0 WIOA
  "tax-prep-financial-services-full": "price_1SsY60IRNf5vPH3ApAUmWGJ9", // $4,950 self-pay
  
  // Technology Courses
  "it-support-specialist": PRICES.IT_SUPPORT,
  "cybersecurity-fundamentals": PRICES.CYBERSECURITY,
  
  // Human Services Courses
  "dsp-certification": PRICES.DSP,
  "drug-collector-certification": PRICES.DRUG_COLLECTOR,
  
  // ============================================================================
  // NDS Training Courses (50/50 Revenue Share = 2x NDS Wholesale Cost)
  // Partner: National Drug Screening / MyDrugTestTraining.com
  // ============================================================================
  
  // Supervisor Training
  "nds-dot-supervisor": "price_1Svz8qIRNf5vPH3AtY0AM9Ox", // $130 (NDS: $65)
  "nds-nondot-supervisor": "price_1Svz8qIRNf5vPH3AoIf0pNax", // $130 (NDS: $65)
  "nds-dot-supervisor-refresher": "price_1SvzA2IRNf5vPH3A03yUFSHP", // $90 (NDS: $45)
  "nds-supervisor-bundle": "price_1SvzARIRNf5vPH3AFwwdDqYE", // $220 (NDS: $110)
  "nds-fra-supervisor": "price_1SvzA7IRNf5vPH3AGlkbCwTV", // $440 (NDS: $220)
  
  // Employee Training
  "nds-dfwp-employee": "price_1Svz8rIRNf5vPH3ABz5zU1UW", // $44 (NDS: $22)
  
  // Collector Certification
  "nds-dot-urine-full": "price_1Svz8yIRNf5vPH3ADpVzcaYT", // $1,310 (NDS: $655)
  "nds-dot-urine-mocks": "price_1Svz8zIRNf5vPH3Auu8QZyT1", // $660 (NDS: $330)
  "nds-dot-oral-full": "price_1Svz8zIRNf5vPH3AfraNLRot", // $1,398 (NDS: $699)
  "nds-dot-oral-nomocks": "price_1Svz9wIRNf5vPH3ASrjCCZQc", // $998 (NDS: $499)
  "nds-oral-nondot": "price_1Svz8zIRNf5vPH3AubLEClix", // $700 (NDS: $350)
  "nds-stt": "price_1SvzACIRNf5vPH3AqdXR56ce", // $598 (NDS: $299)
  "nds-hair-collector": "price_1SvzAHIRNf5vPH3AolTMpnM8", // $798 (NDS: $399)
  "nds-dna-collector": "price_1SvzANIRNf5vPH3AhlPcOdfX", // $598 (NDS: $299)
  
  // DER Training (Designated Employer Representative)
  "nds-der-fmcsa": "price_1Svz96IRNf5vPH3Ap9VFD314", // $440 (NDS: $220)
  "nds-der-faa": "price_1Svz96IRNf5vPH3ATdvWWy7x", // $440 (NDS: $220)
  "nds-der-fra": "price_1Svz9PIRNf5vPH3AisCDpbQD", // $440 (NDS: $220)
  "nds-der-fta": "price_1Svz9TIRNf5vPH3AcZZPARQk", // $440 (NDS: $220)
  "nds-der-phmsa": "price_1Svz9YIRNf5vPH3AUReVz4ph", // $440 (NDS: $220)
  "nds-der-uscg": "price_1Svz9cIRNf5vPH3AKvxdKFJe", // $440 (NDS: $220)
  "nds-der-nondot": "price_1Svz96IRNf5vPH3Ai9YE9aZy", // $440 (NDS: $220)
  
  // Advanced & Business Training
  "nds-startup": "price_1Svz9hIRNf5vPH3AYYMncT7Q", // $198 (NDS: $99)
  "nds-ttt-urine": "price_1Svz9mIRNf5vPH3A1bVgS4K4", // $3,500 (NDS: $1,750)
  "nds-ttt-oral": "price_1Svz9rIRNf5vPH3AXdbAxxh1", // $3,998 (NDS: $1,999)
  
  // ============================================================================
  // CDL Program & Included Courses
  // These courses are included FREE with CDL program enrollment
  // ============================================================================
  "cdl-training-program": "price_1Sw0KEIRNf5vPH3A0v7RlAZK", // $4,999 CDL Training Program
  
  // CDL-Included NDS Courses (bundled with CDL program - no separate price)
  // These are tracked as products but don't have individual prices
  "nds-cdl-drug-alcohol": "prod_TtmCfKsaUoite8", // Included with CDL
  "nds-cdl-hours-of-service": "prod_TtmC90w72WxHH4", // Included with CDL
  "nds-cdl-pre-trip": "prod_TtmCNuxvORiMSh", // Included with CDL
  "nds-cdl-reasonable-suspicion": "prod_TtmCbhMkt7eUSZ", // Included with CDL
  "nds-cdl-drug-free-workplace": "prod_TtmCUg8PrKOBtq", // Included with CDL
  
  // ============================================================================
  // TRAINING PROGRAMS (Full Programs with Tuition)
  // From tuition-fees page and program-constants.ts
  // ============================================================================
  
  // Healthcare Programs
  "cna-certification-program": "price_1Sw0MjIRNf5vPH3AsbrosRzm", // $1,200
  "medical-assistant-program": "price_1Sw0MiIRNf5vPH3AKrl1byt4", // $4,200
  "phlebotomy-technician-program": "price_1Sw0MoIRNf5vPH3AkuXr8MH2", // $1,305
  "home-health-aide-program": "price_1Sw0MvIRNf5vPH3AVqaHbVEk", // $4,700
  "emergency-health-safety-program": "price_1Sw0MvIRNf5vPH3A9fiqsHgk", // $4,750
  
  // Skilled Trades Programs
  "hvac-technician-program": "price_1Sw0MiIRNf5vPH3AtfgR47tM", // $5,500
  "building-maintenance-program": "price_1Sw0MoIRNf5vPH3AlfgIkzex", // $3,800
  "welding-certification-program": "price_1Sw0N1IRNf5vPH3AxgRLR0Tc", // $4,999
  "electrical-apprenticeship-program": "price_1Sw0N2IRNf5vPH3AUJiE2wcx", // $4,999
  "plumbing-apprenticeship-program": "price_1Sw0N7IRNf5vPH3AKxaVMVu7", // $4,999
  
  // Beauty & Cosmetology Programs
  "barber-apprenticeship-program": "price_1Sw0MiIRNf5vPH3AQm0MtqGP", // $4,980
  "cosmetology-apprenticeship-program": "price_1Sw0N8IRNf5vPH3ACCquL2DS", // $4,999
  "esthetician-apprenticeship-program": "price_1Sw0MvIRNf5vPH3AQmARwmN1", // $2,800
  "beauty-career-educator-program": "price_1Sw0MpIRNf5vPH3AoiFUXQUY", // $4,575
  
  // Transportation Programs
  "cdl-training-program": "price_1Sw0KEIRNf5vPH3A0v7RlAZK", // $4,999
  
  // Technology Programs
  "it-support-specialist-program": "price_1Sw0N7IRNf5vPH3AYhZD45UF", // $4,499
  "cybersecurity-program": "price_1Sw0N8IRNf5vPH3A6NdTRo3a", // $4,499
  
  // Human Services Programs
  "peer-recovery-coach-program": "price_1Sw0MpIRNf5vPH3AovSyk3Z9", // $2,500
  "public-safety-reentry-program": "price_1Sw0N1IRNf5vPH3AU4qwlgnV", // $4,325
  "drug-collector-certification-program": "price_1Sw0N1IRNf5vPH3ASlJFEiv8", // $4,750
  
  // Business Programs
  "business-startup-marketing-program": "price_1Sw0MvIRNf5vPH3AKGMFKJJA", // $4,750
  
  // ============================================================================
  // PAYMENT PLANS (Self-Pay Installments) - 35% Deposit + 65% in 6 Installments
  // All deposits under $2,000 = BNPL eligible (Klarna, Afterpay, Zip, Affirm)
  // Structure: 35% Deposit (one-time) + Monthly installments (one-time each)
  // ============================================================================
  
  // Barber Apprenticeship - $4,980 = $1,743 (35%) + $540 × 6
  "barber-deposit": "price_1Sw3XrIRNf5vPH3AV9CpXMQD", // $1,743
  "barber-installment": "price_1Sw3YiIRNf5vPH3A0HdYRJtK", // $540
  
  // CNA Certification - $1,200 = $420 (35%) + $195 × 4
  "cna-deposit": "price_1Sw3XrIRNf5vPH3AYj5EUeqD", // $420
  "cna-installment": "price_1Sw3YjIRNf5vPH3AqtrrnWP0", // $195
  
  // HVAC Technician - $5,500 = $1,925 (35%) + $596 × 6
  "hvac-deposit": "price_1Sw3XsIRNf5vPH3ATDbqt5QL", // $1,925
  "hvac-installment": "price_1Sw3YjIRNf5vPH3AQHvq4yd1", // $596
  
  // CDL Training - $5,000 = $1,750 (35%) + $542 × 6
  "cdl-deposit": "price_1Sw3XsIRNf5vPH3AHXKqZ6OI", // $1,750
  "cdl-installment": "price_1Sw3YjIRNf5vPH3AxkT8PNbx", // $542
  
  // Cosmetology - $4,999 = $1,750 (35%) + $542 × 6
  "cosmetology-deposit": "price_1Sw3Y2IRNf5vPH3AAJoD2ghz", // $1,750
  "cosmetology-installment": "price_1Sw3YqIRNf5vPH3AAB0Obzjp", // $542
  
  // Esthetician - $2,800 = $980 (35%) + $303 × 6
  "esthetician-deposit": "price_1Sw3Y3IRNf5vPH3Axy85e22q", // $980
  "esthetician-installment": "price_1Sw3YqIRNf5vPH3AOC6VVohj", // $303
  
  // Medical Assistant - $4,200 = $1,470 (35%) + $455 × 6
  "medical-assistant-deposit": "price_1Sw3Y3IRNf5vPH3AXRggDlJi", // $1,470
  "medical-assistant-installment": "price_1Sw3YrIRNf5vPH3ANZfn2u9m", // $455
  
  // Welding - $4,999 = $1,750 (35%) + $542 × 6
  "welding-deposit": "price_1Sw3Y3IRNf5vPH3A30fWmtg3", // $1,750
  "welding-installment": "price_1Sw3YrIRNf5vPH3Ap1OsYkwq", // $542
  
  // Electrical - $4,999 = $1,750 (35%) + $542 × 6
  "electrical-deposit": "price_1Sw3YEIRNf5vPH3AY5GRReaX", // $1,750
  "electrical-installment": "price_1Sw3Z3IRNf5vPH3AYxrQp4HL", // $542
  
  // Plumbing - $4,999 = $1,750 (35%) + $542 × 6
  "plumbing-deposit": "price_1Sw3YEIRNf5vPH3AIeqemem8", // $1,750
  "plumbing-installment": "price_1Sw3Z4IRNf5vPH3AboQGZeSP", // $542
  
  // IT Support - $4,499 = $1,575 (35%) + $487 × 6
  "it-support-deposit": "price_1Sw3YFIRNf5vPH3AULx56Eyc", // $1,575
  "it-support-installment": "price_1Sw3Z4IRNf5vPH3AEzQRlqTJ", // $487
  
  // Cybersecurity - $4,499 = $1,575 (35%) + $487 × 6
  "cybersecurity-deposit": "price_1Sw3YFIRNf5vPH3AqtXyw81e", // $1,575
  "cybersecurity-installment": "price_1Sw3Z4IRNf5vPH3AIpbLLryI", // $487
  
  // Building Maintenance - $3,800 = $1,330 (35%) + $412 × 6
  "building-maintenance-deposit": "price_1Sw3YFIRNf5vPH3AxAChyphR", // $1,330
  "building-maintenance-installment": "price_1Sw3Z5IRNf5vPH3Av1R9U6qa", // $412
};

// ============================================================================
// PAYMENT LINKS
// Self-Pay Programs: Full Payment + 35% Deposit options (Card + BNPL)
// WIOA Programs: $0 Free Enrollment links
// ============================================================================

export const PAYMENT_LINKS = {
  // ============================================================================
  // SELF-PAY PROGRAMS (Paid enrollment with BNPL options)
  // ============================================================================
  
  // Barber Apprenticeship - $4,980
  barber: {
    full: "https://buy.stripe.com/6oUdRa4lkaHB7141hR8EN0b", // $4,980
    deposit: "https://buy.stripe.com/8x2bJ21986rletw0dN8EN0o", // $1,743 (35%)
  },
  
  // CNA Certification - $1,200
  cna: {
    full: "https://buy.stripe.com/fZu7sM6tseXRdps8Kj8EN0c", // $1,200
    deposit: "https://buy.stripe.com/5kQ5kEbNMbLFadgf8H8EN0p", // $420 (35%)
  },
  
  // Cosmetology - $4,999
  cosmetology: {
    full: "https://buy.stripe.com/14AeVedVU3f98586Cb8EN0f", // $4,999
    deposit: "https://buy.stripe.com/4gMcN63hg4jd99c8Kj8EN0s", // $1,750 (35%)
  },
  
  // Nail Technician - $2,490
  nailTech: {
    full: "https://buy.stripe.com/4gM5kEdVU8ztetwbWv8EN0L", // $2,490
    deposit: "https://buy.stripe.com/8x25kE6ts9DxfxAgcL8EN0M", // $872 (35%)
  },
  
  // ============================================================================
  // WIOA PROGRAMS ($0 Free Enrollment)
  // ============================================================================
  
  // Tax Preparation & Financial Services - FREE (WIOA)
  taxPrep: {
    free: "https://buy.stripe.com/28EdRa7xwcPJdpsd0z8EN0N",
  },

  // HVAC Technician - FREE (WIOA)
  hvac: {
    free: "https://buy.stripe.com/fZu3cw3hg2b5bhk0dN8EN0B",
  },
  
  // CDL Training - FREE (WIOA)
  cdl: {
    free: "https://buy.stripe.com/7sYfZi198bLFfxA6Cb8EN0C",
  },
  
  // Medical Assistant - FREE (WIOA)
  medicalAssistant: {
    free: "https://buy.stripe.com/eVq4gAdVU02X5X04u38EN0D",
  },
  
  // Welding - FREE (WIOA)
  welding: {
    free: "https://buy.stripe.com/3cIcN6054aHB2KO2lV8EN0E",
  },
  
  // Electrical - FREE (WIOA)
  electrical: {
    free: "https://buy.stripe.com/8x2dRaaJI171etwd0z8EN0F",
  },
  
  // Plumbing - FREE (WIOA)
  plumbing: {
    free: "https://buy.stripe.com/aFacN6dVUeXR3OSaSr8EN0G",
  },
  
  // IT Support - FREE (WIOA)
  itSupport: {
    free: "https://buy.stripe.com/aFabJ2dVUdTN3OS3pZ8EN0H",
  },
  
  // Cybersecurity - FREE (WIOA)
  cybersecurity: {
    free: "https://buy.stripe.com/5kQbJ26ts02X3OSaSr8EN0I",
  },
  
  // Building Maintenance - FREE (WIOA)
  buildingMaintenance: {
    free: "https://buy.stripe.com/eVqaEY6ts8ztgBEbWv8EN0J",
  },
  
  // Esthetician - FREE (WIOA)
  esthetician: {
    free: "https://buy.stripe.com/9B6aEY6ts9Dx4SW6Cb8EN0K",
  },
};

// Helper to check if price IDs are configured (not placeholders)
export function isPriceConfigured(productId: string): boolean {
  const priceId = STRIPE_PRICE_IDS[productId];
  return priceId !== undefined && 
         priceId.startsWith('price_') && 
         !priceId.includes('PLACEHOLDER');
}

// Get price ID for a product
export function getPriceId(productId: string): string | null {
  return STRIPE_PRICE_IDS[productId] || null;
}

// Runtime guard - throws if required price IDs are not configured
export function validateRequiredPriceIds(): void {
  const requiredProducts = [
    'capital-readiness-guide',
  ];

  const missingOrPlaceholder: string[] = [];

  for (const productId of requiredProducts) {
    if (!isPriceConfigured(productId)) {
      missingOrPlaceholder.push(productId);
    }
  }

  if (missingOrPlaceholder.length > 0) {
    throw new Error(
      `Missing or placeholder Stripe Price IDs for: ${missingOrPlaceholder.join(', ')}. ` +
      `Set the following env vars: ${missingOrPlaceholder.map(p => `STRIPE_PRICE_${p.toUpperCase().replace(/-/g, '_')}`).join(', ')}`
    );
  }
}

// Stripe Price ID Mapping
// Maps store product IDs to Stripe Price IDs
// Uses centralized PRICES config (lib/stripe/prices.ts) instead of individual env vars

import { PRICES } from './prices';

export const STRIPE_PRICE_IDS: Record<string, string> = {
  // Capital Readiness Guide Products
  "capital-readiness-guide": PRICES.CR_GUIDE || "price_1TM739H4a2yrVOt5sa7tHAqZ",
  "capital-readiness-enterprise": PRICES.CR_ENTERPRISE || "price_1TM739H4a2yrVOt56SpjIuVx",
  
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
  "tax-prep-financial-services": "price_1TM739H4a2yrVOt5aGFKqYPH", // $0 WIOA
  "tax-prep-financial-services-full": "price_1TM739H4a2yrVOt5rAT6QPPF", // $4,950 self-pay
  
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
  "nds-dot-supervisor": "price_1TM73qH4a2yrVOt56xkFtovp", // $130 (NDS: $65)
  "nds-nondot-supervisor": "price_1TM73qH4a2yrVOt5m5A3J7FZ", // $130 (NDS: $65)
  "nds-dot-supervisor-refresher": "price_1TM73qH4a2yrVOt56ZEdRzW7", // $90 (NDS: $45)
  "nds-supervisor-bundle": "price_1TM73rH4a2yrVOt5k7ye5zET", // $220 (NDS: $110)
  "nds-fra-supervisor": "price_1TM73rH4a2yrVOt5y6IVf3TJ", // $440 (NDS: $220)
  
  // Employee Training
  "nds-dfwp-employee": "price_1TM73rH4a2yrVOt583dRVp7F", // $44 (NDS: $22)
  
  // Collector Certification
  "nds-dot-urine-full": "price_1TM73rH4a2yrVOt5q3Nm7P1z", // $1,310 (NDS: $655)
  "nds-dot-urine-mocks": "price_1TM73sH4a2yrVOt5tZcADPNi", // $660 (NDS: $330)
  "nds-dot-oral-full": "price_1TM73sH4a2yrVOt5NYgBplDU", // $1,398 (NDS: $699)
  "nds-dot-oral-nomocks": "price_1TM73sH4a2yrVOt5vhi8MHn3", // $998 (NDS: $499)
  "nds-oral-nondot": "price_1TM73tH4a2yrVOt5huW4pto0", // $700 (NDS: $350)
  "nds-stt": "price_1TM73tH4a2yrVOt5QfcjhejZ", // $598 (NDS: $299)
  "nds-hair-collector": "price_1TM73tH4a2yrVOt57KpmLmBu", // $798 (NDS: $399)
  "nds-dna-collector": "price_1TM73tH4a2yrVOt5MoVAzS2r", // $598 (NDS: $299)
  
  // DER Training (Designated Employer Representative)
  "nds-der-fmcsa": "price_1TM73uH4a2yrVOt57HimwibJ", // $440 (NDS: $220)
  "nds-der-faa": "price_1TM73uH4a2yrVOt54H3VIugq", // $440 (NDS: $220)
  "nds-der-fra": "price_1TM73uH4a2yrVOt5DpEuTd40", // $440 (NDS: $220)
  "nds-der-fta": "price_1TM73uH4a2yrVOt5v4K3oDMk", // $440 (NDS: $220)
  "nds-der-phmsa": "price_1TM73vH4a2yrVOt5LeIlE5gO", // $440 (NDS: $220)
  "nds-der-uscg": "price_1TM73vH4a2yrVOt54LIDAPG7", // $440 (NDS: $220)
  "nds-der-nondot": "price_1TM73vH4a2yrVOt5JuATKIY3", // $440 (NDS: $220)
  
  // Advanced & Business Training
  "nds-startup": "price_1TM73vH4a2yrVOt5arZTwfbS", // $198 (NDS: $99)
  "nds-ttt-urine": "price_1TM73wH4a2yrVOt5fdQDVTaK", // $3,500 (NDS: $1,750)
  "nds-ttt-oral": "price_1TM73wH4a2yrVOt5RjHXY9Rt", // $3,998 (NDS: $1,999)
  
  // ============================================================================
  // CDL Program & Included Courses
  // These courses are included FREE with CDL program enrollment
  // ============================================================================
  "cdl-training-program": "price_1TL78oH4a2yrVOt5j3W2RODU", // $5,000 CDL Training Program
  
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
  "cna-certification-program": "price_1TM734H4a2yrVOt576980dOP", // $1,200
  "medical-assistant-program": "price_1TL78pH4a2yrVOt5e1fNELc1", // $5,000
  "phlebotomy-technician-program": "price_1TM735H4a2yrVOt5EUodG4oW", // $1,305
  "home-health-aide-program": "price_1TM735H4a2yrVOt5mCepG1xj", // $4,700
  "emergency-health-safety-program": "price_1TM735H4a2yrVOt5z3cwMbJY", // $4,750
  
  // Skilled Trades Programs
  "hvac-technician-program": "price_1TM736H4a2yrVOt58I9gWXg3", // $5,500
  "building-maintenance-program": "price_1TL78qH4a2yrVOt5pPwKb1FN", // $5,000
  "welding-certification-program": "price_1TM736H4a2yrVOt5sUkSXAiU", // $4,999
  "electrical-apprenticeship-program": "price_1TL78qH4a2yrVOt5sMge9iWo", // $5,000
  "plumbing-apprenticeship-program": "price_1TM736H4a2yrVOt5o6hHlfEh", // $4,999
  
  // Beauty & Cosmetology Programs
  "barber-apprenticeship-program": "price_1TM736H4a2yrVOt5z6NbBkUl", // $4,980
  "cosmetology-apprenticeship-program": "price_1TL78oH4a2yrVOt55kVJPUm4", // $6,000
  "esthetician-apprenticeship-program": "price_1TL78nH4a2yrVOt5nF6hrDxl", // $6,000
  "nail-technician-apprenticeship-program": "price_1TL78mH4a2yrVOt5V1FmZlrB", // $5,000
  "beauty-career-educator-program": "price_1TM737H4a2yrVOt5isaWBbHM", // $4,575
  
  // Transportation Programs
  "cdl-training-program": "price_1TM737H4a2yrVOt54Vd6Peog", // $4,999
  
  // Technology Programs
  "it-support-specialist-program": "price_1TM737H4a2yrVOt5LeCDx7pS", // $4,499
  "cybersecurity-program": "price_1TM737H4a2yrVOt5ZrrVSqaR", // $4,499
  
  // Human Services Programs
  "peer-recovery-coach-program": "price_1TL6nOH4a2yrVOt5uVAEh7Y7", // $5,000 self-pay
  // Peer Recovery — $5,000 = $1,750 (35%) + $542 × 6
  "peer-recovery-deposit": "price_1TL6npH4a2yrVOt58BKj4ff7", // $1,750 (35%)
  "peer-recovery-installment": "price_1TM71xH4a2yrVOt5tnSOTDIz", // $542
  "public-safety-reentry-program": "price_1TM738H4a2yrVOt5HsdNFgRy", // $4,325
  "drug-collector-certification-program": "price_1TM738H4a2yrVOt5HovjAY5f", // $4,750
  
  // Business Programs
  "business-startup-marketing-program": "price_1TM738H4a2yrVOt58h0sGxWt", // $4,750
  
  // ============================================================================
  // PAYMENT PLANS (Self-Pay Installments) - 35% Deposit + 65% in 6 Installments
  // All deposits under $2,000 = BNPL eligible (Klarna, Afterpay, Zip, Affirm)
  // Structure: 35% Deposit (one-time) + Monthly installments (one-time each)
  // ============================================================================
  
  // Barber Apprenticeship - $4,980 = $1,743 (35%) + $540 × 6
  "barber-deposit": "price_1TM73QH4a2yrVOt5ttSVuX0j", // $1,743
  "barber-installment": "price_1TM73QH4a2yrVOt52CuDtRJW", // $540
  
  // CNA Certification - $1,200 = $600 (min deposit) + $100 × 6
  // Note: 35% of $1,200 = $420, but $600 minimum floor applies
  "cna-deposit": "price_1TL6sCH4a2yrVOt5oCumO34g", // $600
  "cna-installment": "price_1TM73RH4a2yrVOt5fydlNf0u", // $100
  
  // HVAC Technician - $5,500 = $1,925 (35%) + $596 × 6
  "hvac-deposit": "price_1TM73RH4a2yrVOt58WxaWYKk", // $1,925
  "hvac-installment": "price_1TM73RH4a2yrVOt5T5Hyzbnk", // $596
  
  // CDL Training - $5,000 = $1,750 (35%) + $542 × 6
  "cdl-deposit": "price_1TL78pH4a2yrVOt5C5MpaAtq", // $1,750
  "cdl-installment": "price_1TM73RH4a2yrVOt5sTtE2yzC", // $542

  // Cosmetology - $6,000 = $2,100 (35%) + $650 × 6
  "cosmetology-deposit": "price_1TL78oH4a2yrVOt5s3YPcgck", // $2,100
  "cosmetology-installment": "price_1TM71wH4a2yrVOt5hSnbzd1w", // $650

  // Esthetician - $6,000 = $2,100 (35%) + $650 × 6
  "esthetician-deposit": "price_1TL78nH4a2yrVOt5DsjMkXwl", // $2,100
  "esthetician-installment": "price_1TM71wH4a2yrVOt52MaUVQBC", // $650

  // Nail Technician - $5,000 = $1,750 (35%) + $542 × 6
  "nail-technician-deposit": "price_1TL78mH4a2yrVOt5UCtbaZ6c", // $1,750
  "nail-technician-installment": "price_1TM71xH4a2yrVOt542VwjCuw", // $542

  // Medical Assistant - $5,000 = $1,750 (35%) + $542 × 6
  "medical-assistant-deposit": "price_1TL78pH4a2yrVOt5HYh0t4JF", // $1,750
  "medical-assistant-installment": "price_1TM71xH4a2yrVOt5DL2XpL29", // $542

  // Welding - $4,999 = $1,750 (35%) + $542 × 6
  "welding-deposit": "price_1TM73SH4a2yrVOt5GdwLAHwp", // $1,750
  "welding-installment": "price_1TM73SH4a2yrVOt51EGukCpE", // $542

  // Electrical - $5,000 = $1,750 (35%) + $542 × 6
  "electrical-deposit": "price_1TL78qH4a2yrVOt52WqyvdBm", // $1,750
  "electrical-installment": "price_1TM73SH4a2yrVOt51PM2gr6F", // $542

  // Plumbing - $4,999 = $1,750 (35%) + $542 × 6
  "plumbing-deposit": "price_1TM73SH4a2yrVOt5w2YKY9t2", // $1,750
  "plumbing-installment": "price_1TM73TH4a2yrVOt5cMAS8rUP", // $542

  // IT Support - $4,499 = $1,575 (35%) + $487 × 6
  "it-support-deposit": "price_1TM73TH4a2yrVOt5JWEYj9jw", // $1,575
  "it-support-installment": "price_1TM73TH4a2yrVOt5wTPP9FzJ", // $487

  // Cybersecurity - $4,499 = $1,575 (35%) + $487 × 6
  "cybersecurity-deposit": "price_1TM73UH4a2yrVOt5a5lE4lGX", // $1,575
  "cybersecurity-installment": "price_1TM73UH4a2yrVOt5geQfvjtl", // $487

  // Building Maintenance - $5,000 = $1,750 (35%) + $542 × 6
  "building-maintenance-deposit": "price_1TL78rH4a2yrVOt50iYCGjXu", // $1,750
  "building-maintenance-installment": "price_1TM71xH4a2yrVOt5ADW5qbBg", // $542
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
    deposit: "https://buy.stripe.com/bJe6oHgLK1EG4NZdjHgIo04", // $600 (min deposit)
  },
  
  // Cosmetology - $6,000
  cosmetology: {
    full: "https://buy.stripe.com/9B600jbrq1EGdkvgvTgIo09", // $6,000
    deposit: "https://buy.stripe.com/fZu00j2UUdnofsDcfDgIo0a", // $2,100 (35%)
  },

  // Nail Technician - $5,000
  nailTech: {
    full: "https://buy.stripe.com/bJedR91QQgzAfsD0wVgIo05", // $5,000
    deposit: "https://buy.stripe.com/cNicN52UU4QS4NZ1AZgIo06", // $1,750 (35%)
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
  
  // CDL Training - $5,000 self-pay / FREE (WIOA)
  cdl: {
    free: "https://buy.stripe.com/7sYfZi198bLFfxA6Cb8EN0C", // $0 WIOA
    full: "https://buy.stripe.com/00w28r0MM3MObcnenLgIo0b", // $5,000
    deposit: "https://buy.stripe.com/7sYaEX1QQers0xJ93rgIo0c", // $1,750 (35%)
  },

  // Medical Assistant - $5,000 self-pay / FREE (WIOA)
  medicalAssistant: {
    free: "https://buy.stripe.com/eVq4gAdVU02X5X04u38EN0D", // $0 WIOA
    full: "https://buy.stripe.com/7sYeVd1QQ5UW0xJ0wVgIo0d", // $5,000
    deposit: "https://buy.stripe.com/3cI6oH3YY1EG5S37ZngIo0e", // $1,750 (35%)
  },
  
  // Welding - FREE (WIOA)
  welding: {
    free: "https://buy.stripe.com/3cIcN6054aHB2KO2lV8EN0E",
  },
  
  // Electrical - $5,000 self-pay / FREE (WIOA)
  electrical: {
    free: "https://buy.stripe.com/8x2dRaaJI171etwd0z8EN0F", // $0 WIOA
    full: "https://buy.stripe.com/6oU14n6765UW94fgvTgIo0f", // $5,000
    deposit: "https://buy.stripe.com/aFa7sL3YYdno80bgvTgIo0g", // $1,750 (35%)
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
  
  // Building Maintenance - $5,000 self-pay / FREE (WIOA)
  buildingMaintenance: {
    free: "https://buy.stripe.com/eVqaEY6ts8ztgBEbWv8EN0J", // $0 WIOA
    full: "https://buy.stripe.com/8x2fZhdzy1EG0xJ0wVgIo0h", // $5,000
    deposit: "https://buy.stripe.com/4gMbJ1brqgzA5S31AZgIo0i", // $1,750 (35%)
  },
  
  // Esthetician - FREE (WIOA) + Self-Pay ($6,000)
  esthetician: {
    free: "https://buy.stripe.com/9B6aEY6ts9Dx4SW6Cb8EN0K", // $0 WIOA
    full: "https://buy.stripe.com/6oUbJ16762IK1BN1AZgIo07", // $6,000 self-pay full
    deposit: "https://buy.stripe.com/fZu4gzbrq2IK5S32F3gIo08", // $2,100 (35% deposit)
  },

  // Peer Recovery Specialist - $5,000 self-pay (WIOA also available)
  peerRecovery: {
    full: "https://buy.stripe.com/8x2cN5eDC4QS5S3a7vgIo00", // $5,000 self-pay full
    deposit: "https://buy.stripe.com/4gM3cv1QQcjk4NZenLgIo01", // $1,750 (35% deposit)
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

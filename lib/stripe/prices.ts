/**
 * Centralized Stripe Price ID resolution.
 *
 * Reads a single STRIPE_PRICES_JSON env var (compact JSON object mapping
 * short keys to Stripe price IDs) instead of 35+ individual STRIPE_PRICE_*
 * env vars. This keeps the Netlify env payload well under the AWS Lambda
 * 4KB limit.
 *
 * Fallback chain: STRIPE_PRICES_JSON → individual STRIPE_PRICE_* env var → hardcoded default.
 */

// Parse the consolidated JSON once at module load
let pricesFromJson: Record<string, string> = {};
try {
  const raw = process.env.STRIPE_PRICES_JSON;
  if (raw) {
    pricesFromJson = JSON.parse(raw);
  }
} catch {
  // Invalid JSON — fall through to individual env vars / defaults
}

/**
 * Resolve a Stripe price ID.
 *
 * @param key       Short key, e.g. "BARBER", "CNA", "CORE_ONETIME"
 * @param fallback  Hardcoded default price ID (from Stripe dashboard)
 */
export function getStripePrice(key: string, fallback: string = ''): string {
  // 1. Consolidated JSON (preferred — single env var)
  if (pricesFromJson[key]) return pricesFromJson[key];

  // 2. Individual env var (legacy — works but adds to env payload)
  const envVal = process.env[`STRIPE_PRICE_${key}`];
  if (envVal) return envVal;

  // 3. Hardcoded fallback
  return fallback;
}

// Re-export commonly used prices with their hardcoded defaults
// These match the existing values from price-map.ts

export const PRICES = {
  // Subscription plans
  MONTHLY: getStripePrice('MONTHLY'),
  ANNUAL: getStripePrice('ANNUAL'),
  STARTER_MONTHLY: getStripePrice('STARTER_MONTHLY', 'price_1Ss3ZWIRNf5vPH3AuVbnrr9f'),
  STARTER_ANNUAL: getStripePrice('STARTER_ANNUAL', 'price_1Ss3ZbIRNf5vPH3A3uBdM51z'),
  PROFESSIONAL_MONTHLY: getStripePrice('PROFESSIONAL_MONTHLY', 'price_1Ss3ZnIRNf5vPH3AO9AOYaqR'),
  PROFESSIONAL_ANNUAL: getStripePrice('PROFESSIONAL_ANNUAL', 'price_1Ss3ZxIRNf5vPH3AG1bn8tRu'),

  // Platform licenses
  CORE: getStripePrice('CORE'),
  CORE_ONETIME: getStripePrice('CORE_ONETIME', 'price_1Ss3aLIRNf5vPH3AtixJXl6D'),
  CORE_3MONTH: getStripePrice('CORE_3MONTH', 'price_1Ss3aTIRNf5vPH3A9xZN6yvH'),
  CORE_6MONTH: getStripePrice('CORE_6MONTH', 'price_1Ss3aTIRNf5vPH3AeT9kJunL'),
  CORE_12MONTH: getStripePrice('CORE_12MONTH', 'price_1Ss3aUIRNf5vPH3AhWYE1qyw'),
  SCHOOL: getStripePrice('SCHOOL', 'price_1Ss3aaIRNf5vPH3Ai4VLJjG6'),
  INSTITUTIONAL: getStripePrice('INSTITUTIONAL'),
  ENTERPRISE: getStripePrice('ENTERPRISE', 'price_1Ss3ajIRNf5vPH3AZ8vgaV46'),

  // Programs
  BARBER: getStripePrice('BARBER', 'price_1Ss3bDIRNf5vPH3AQh4x3gYn'),
  BARBER_SETUP_FEE: getStripePrice('BARBER_SETUP_FEE'),
  BARBER_WEEKLY: getStripePrice('BARBER_WEEKLY'),
  CNA: getStripePrice('CNA', 'price_1Ss3atIRNf5vPH3ANvaqAzO9'),
  CDL: getStripePrice('CDL', 'price_1Ss3b3IRNf5vPH3AwF1d7Lgl'),
  HVAC: getStripePrice('HVAC', 'price_1Ss3b3IRNf5vPH3AdlqIsVRL'),
  WELDING: getStripePrice('WELDING', 'price_1Ss3b4IRNf5vPH3A2bjMtqPF'),
  ELECTRICAL: getStripePrice('ELECTRICAL', 'price_1Ss3bCIRNf5vPH3AR7AZXQeZ'),
  PLUMBING: getStripePrice('PLUMBING', 'price_1Ss3bDIRNf5vPH3AJEdKkCFc'),
  COSMETOLOGY: getStripePrice('COSMETOLOGY', 'price_1Ss3bXIRNf5vPH3AdF9ISYBO'),
  PHLEBOTOMY: getStripePrice('PHLEBOTOMY', 'price_1Ss3atIRNf5vPH3AEbMabQOt'),
  MEDICAL_ASSISTANT: getStripePrice('MEDICAL_ASSISTANT', 'price_1Ss3auIRNf5vPH3A0UcyDI5U'),
  IT_SUPPORT: getStripePrice('IT_SUPPORT', 'price_1Ss3bOIRNf5vPH3ArNQHT9HZ'),
  CYBERSECURITY: getStripePrice('CYBERSECURITY', 'price_1Ss3bOIRNf5vPH3A8mAE9YWr'),
  TAX_PREP: getStripePrice('TAX_PREP', 'price_1Ss3bPIRNf5vPH3AOz1FyRZ0'),
  DSP: getStripePrice('DSP', 'price_1Ss3bXIRNf5vPH3AxFEVmeWz'),
  DRUG_COLLECTOR: getStripePrice('DRUG_COLLECTOR', 'price_1Ss3bYIRNf5vPH3APCasxzte'),

  // Store products
  CR_GUIDE: getStripePrice('CR_GUIDE'),
  CR_ENTERPRISE: getStripePrice('CR_ENTERPRISE'),

  // Booth rentals — weekly subscriptions
  BOOTH_BARBER_WEEKLY:    getStripePrice('BOOTH_BARBER_WEEKLY'),
  BOOTH_COSMO_WEEKLY:     getStripePrice('BOOTH_COSMO_WEEKLY'),
  BOOTH_NAIL_WEEKLY:      getStripePrice('BOOTH_NAIL_WEEKLY'),
  BOOTH_ESTHI_WEEKLY:     getStripePrice('BOOTH_ESTHI_WEEKLY'),

  // Booth rental deposits — one-time charges at signup
  BOOTH_BARBER_DEPOSIT:   getStripePrice('BOOTH_BARBER_DEPOSIT'),
  BOOTH_COSMO_DEPOSIT:    getStripePrice('BOOTH_COSMO_DEPOSIT'),
  BOOTH_NAIL_DEPOSIT:     getStripePrice('BOOTH_NAIL_DEPOSIT'),
  // No esthetician deposit

  // Misc
  STUDENT: getStripePrice('STUDENT'),
  CAREER: getStripePrice('CAREER'),
} as const;

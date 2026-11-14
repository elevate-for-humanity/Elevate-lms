export type BillingPlanType = 'full' | 'payment-plan';

export interface BillingConfig {
  programId: string;
  label: string;
  stripeProductId?: string;
  stripePriceFull?: string;
  stripePricePlan?: string;
  defaultPlan: BillingPlanType;
  notes?: string;
}

export const billingConfigs: BillingConfig[] = [
  {
    programId: 'prog-cna',
    label: 'CNA Training',
    stripeProductId: 'prod_cna_example',
    stripePriceFull: 'price_cna_full_example',
    stripePricePlan: 'price_cna_plan_example',
    defaultPlan: 'payment-plan',
    notes:
      'CNA: tuition-based with potential employer sponsorship and payment plans. Not state-funded in your notes.',
  },
  {
    programId: 'prog-barber',
    label: 'Barber Apprenticeship',
    stripeProductId: 'prod_barber_example',
    stripePriceFull: 'price_barber_full_example',
    stripePricePlan: 'price_barber_plan_example',
    defaultPlan: 'payment-plan',
    notes: 'Apprenticeship with low tuition; many costs covered by employer and philanthropy.',
  },
  {
    programId: 'prog-tax-vita',
    label: 'Tax & VITA Track',
    defaultPlan: 'full',
    notes:
      'Typically grant-funded with no tuition. Use Stripe only for optional add-ons or advanced courses.',
  },
  {
    programId: 'prog-hvac',
    label: 'HVAC Technician Pathway',
    stripeProductId: 'prod_hvac_example',
    stripePriceFull: 'price_hvac_full_example',
    stripePricePlan: 'price_hvac_plan_example',
    defaultPlan: 'payment-plan',
    notes:
      'Strong candidate for WRG/WIOA + employer sponsorship; Stripe used for any remaining tuition.',
  },
  {
    programId: 'prog-cdl',
    label: 'CDL Training Pathway',
    stripeProductId: 'prod_cdl_example',
    stripePriceFull: 'price_cdl_full_example',
    stripePricePlan: 'price_cdl_plan_example',
    defaultPlan: 'payment-plan',
    notes: 'Carriers may sponsor; Stripe can support self-pay or gap coverage.',
  },
];

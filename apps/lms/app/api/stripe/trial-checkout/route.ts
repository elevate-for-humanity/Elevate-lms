import { retiredStripeCheckout } from '@/lib/billing/retired-stripe-checkout';
export async function POST(){return retiredStripeCheckout({destination:'/store/plans',reason:'Stripe trials are retired; choose a current QuickBooks-billed plan.'});}

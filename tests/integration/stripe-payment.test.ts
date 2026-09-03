import { describe, it, expect, beforeAll } from 'vitest';

/**
 * Stripe Payment Integration Tests
 * Tests the payment flow configuration and API endpoints
 */

describe('Stripe Payment Integration', () => {
  beforeAll(() => {
    // Verify Stripe keys are configured
    expect(process.env.STRIPE_SECRET_KEY).toBeDefined();
    expect(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).toBeDefined();
  });

  describe('Environment Configuration', () => {
    it('has Stripe secret key configured', () => {
      const key = process.env.STRIPE_SECRET_KEY;
      expect(key).toBeDefined();
      expect(key?.startsWith('sk_')).toBe(true);
    });

    it('has Stripe publishable key configured', () => {
      const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      expect(key).toBeDefined();
      expect(key?.startsWith('pk_')).toBe(true);
    });

    it('has Stripe webhook secret configured', () => {
      const secret = process.env.STRIPE_WEBHOOK_SECRET;
      expect(secret).toBeDefined();
      expect(secret?.startsWith('whsec_')).toBe(true);
    });
  });

  describe('Stripe Client', () => {
    it('can import stripe client without errors', async () => {
      const { stripe } = await import('@/lib/stripe/client');
      expect(stripe).toBeDefined();
    });

    it('stripe config exports correctly', async () => {
      const { getStripe } = await import('@/lib/stripe-config');
      expect(getStripe).toBeDefined();
    });
  });

  describe('Tuition Configuration', () => {
    it('has tuition config defined', async () => {
      const config = await import('@/lib/stripe/tuition-config');
      expect(config).toBeDefined();
    });
  });

  describe('Payment API Routes', () => {
    it('checkout route file exists', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const routePath = path.join(process.cwd(), 'app/api/stripe/checkout/route.ts');
      expect(fs.existsSync(routePath)).toBe(true);
    });

    it('webhook route file exists', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const routePath = path.join(process.cwd(), 'app/api/stripe/webhook/route.ts');
      expect(fs.existsSync(routePath)).toBe(true);
    });

    it('main stripe route file exists', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const routePath = path.join(process.cwd(), 'app/api/stripe/route.ts');
      expect(fs.existsSync(routePath)).toBe(true);
    });
  });

  describe('Payment Flow Components', () => {
    it('enrollment provisioning handles stripe ref', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'lib/enrollmentProvisioning.ts');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('stripeRefId');
    });

    it('enrollment database schema includes stripe fields', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'lib/db/enrollments.ts');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('stripe_ref_id');
    });
  });
});

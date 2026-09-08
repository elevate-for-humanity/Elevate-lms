import { z } from 'zod';

/** One checkout entry contract; each product family keeps its own fulfillment. */
export const CheckoutFlowSchema = z.discriminatedUnion('flow', [
  z.object({
    flow: z.literal('program'),
    slug: z.string().trim().min(1).max(120),
    checkoutMode: z.enum(['full', 'deposit']).default('full'),
    amountCents: z.number().int().positive().optional(),
    applicationReference: z.string().trim().max(160).optional(),
    couponCode: z.string().trim().max(80).optional(),
    successUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional(),
  }),
  z.object({
    flow: z.literal('program_enrollment'),
    program_id: z.string().uuid(),
    funding_source: z
      .enum(['self_pay', 'employer', 'wioa', 'wrg', 'scholarship'])
      .default('self_pay'),
  }),
  z.object({
    flow: z.literal('program_plan'),
    programId: z.string().uuid(),
    paymentType: z.enum(['full', 'plan']).default('full'),
  }),
  z
    .object({
      flow: z.literal('external_course'),
      program: z.string().trim().min(1).max(120),
      courseId: z.string().trim().min(1).max(160),
    })
    .passthrough(),
  z.object({
    flow: z.literal('testing'),
    examType: z.string().trim().min(1).max(120),
    examName: z.string().trim().min(1).max(200),
    bookingType: z.enum(['individual', 'organization']).default('individual'),
    participantCount: z.number().int().min(1).max(100).optional(),
    addOn: z.boolean().optional(),
    slotId: z.string().trim().max(160).optional(),
    email: z.string().email().optional(),
  }),
  z.object({
    flow: z.literal('store_cart'),
    items: z
      .array(
        z.object({
          slug: z.string().trim().min(1).max(160),
          quantity: z.number().int().min(1).max(10).default(1),
        }),
      )
      .max(25)
      .optional(),
  }),
  z.object({
    flow: z.literal('platform_subscription'),
    planId: z.string().trim().min(1).max(120),
    interval: z.enum(['monthly', 'annual']).default('monthly'),
    addonSlugs: z.array(z.string().trim().min(1).max(120)).max(50).default([]),
  }),
  z.object({
    flow: z.literal('implementation_package'),
    packageId: z.string().trim().min(1).max(120),
    paymentChoice: z.enum(['deposit', 'full']).default('deposit'),
  }),
  z.object({
    flow: z.literal('host_shop_subscription'),
    tier: z.string().trim().min(1).max(80),
    partnerId: z.string().uuid().optional(),
  }),
  z.object({
    flow: z.literal('tenant_offer'),
    offerId: z.string().uuid(),
    email: z.string().email().optional(),
    successUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional(),
  }),
  z
    .object({
      flow: z.literal('website_domain'),
      websiteId: z.string().uuid(),
      domainId: z.string().uuid().optional(),
      domain: z.string().trim().min(3).max(253).optional(),
    })
    .passthrough(),
  z.object({ flow: z.literal('donation'), amount: z.number().min(1).max(1_000_000) }),
]);

export type UnifiedCheckoutInput = z.infer<typeof CheckoutFlowSchema>;
export type UnifiedCheckoutFlow = UnifiedCheckoutInput['flow'];
export type CheckoutTarget = { endpoint: string; payload: Record<string, unknown> };

function withoutFlow(input: UnifiedCheckoutInput): Record<string, unknown> {
  const { flow: _flow, ...payload } = input;
  return payload;
}

export function resolveCheckoutTarget(input: UnifiedCheckoutInput): CheckoutTarget {
  const payload = withoutFlow(input);
  switch (input.flow) {
    case 'program':
      return { endpoint: '/api/checkout/program', payload };
    case 'program_enrollment':
      return { endpoint: '/api/programs/enroll/checkout', payload };
    case 'program_plan':
      return { endpoint: '/api/programs/checkout', payload };
    case 'external_course': {
      const { program: _program, courseId: _courseId, ...body } = payload;
      return {
        endpoint: `/api/programs/${encodeURIComponent(input.program)}/external-courses/${encodeURIComponent(input.courseId)}/checkout`,
        payload: body,
      };
    }
    case 'testing':
      return { endpoint: '/api/testing/checkout', payload };
    case 'store_cart':
      return { endpoint: '/api/store/cart-checkout', payload };
    case 'platform_subscription':
      return { endpoint: '/api/store/platform-checkout', payload };
    case 'implementation_package':
      return { endpoint: '/api/store/implementation-checkout', payload };
    case 'host_shop_subscription':
      return { endpoint: '/api/host-shop/subscription/checkout', payload };
    case 'tenant_offer': {
      const { offerId: _offerId, ...body } = payload;
      return {
        endpoint: `/api/platform/offers/${encodeURIComponent(input.offerId)}/checkout`,
        payload: body,
      };
    }
    case 'website_domain': {
      const { websiteId: _websiteId, ...body } = payload;
      return {
        endpoint: `/api/apps/website-builder/sites/${encodeURIComponent(input.websiteId)}/domains/buy`,
        payload: body,
      };
    }
    case 'donation':
      return { endpoint: '/api/donate/create-checkout', payload };
  }
}

export function checkoutResponseUrl(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  const candidate = record.checkoutUrl ?? record.url;
  return typeof candidate === 'string' && candidate.length > 0 ? candidate : null;
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';

const ScheduleSchema = z.object({
  customerExternalKey: z.string().trim().min(1).max(160),
  customerName: z.string().trim().min(1).max(100),
  customerEmail: z.string().email(),
  canonicalProductKey: z.string().trim().regex(/^[a-z0-9][a-z0-9_-]*$/).max(100),
  productName: z.string().trim().min(1).max(100),
  productDescription: z.string().trim().max(4000).optional(),
  amountCents: z.number().int().positive().max(100_000_000),
  cadence: z.enum(['weekly','monthly','quarterly','annual']),
  nextInvoiceDate: z.string().date(),
  remainingInvoices: z.number().int().positive().max(520).nullable().optional(),
  legacyStripeSubscriptionId: z.string().trim().max(255).optional(),
});

const ChangeSchema = z.object({ id: z.string().uuid(), status: z.enum(['active','paused','completed','canceled']) });

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api'); if (limited) return limited;
  const auth = await apiRequireAdmin(request); if (auth.error) return auth.error;
  const parsed = ScheduleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid billing schedule.', issues: parsed.error.issues }, { status: 400 });
  const input = parsed.data;
  const db = await requireAdminClient();
  const result = await db.from('billing_schedules').upsert({
    customer_external_key: input.customerExternalKey, customer_name: input.customerName,
    customer_email: input.customerEmail.toLowerCase(), canonical_product_key: input.canonicalProductKey,
    product_name: input.productName, product_description: input.productDescription || null,
    provider: 'quickbooks', amount_cents: input.amountCents, cadence: input.cadence,
    next_invoice_date: input.nextInvoiceDate, remaining_invoices: input.remainingInvoices ?? null,
    status: 'active', legacy_stripe_subscription_id: input.legacyStripeSubscriptionId || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'provider,customer_external_key,canonical_product_key' }).select('id').single();
  if (result.error) return NextResponse.json({ error: 'Billing schedule could not be saved.' }, { status: 500 });
  return NextResponse.json({ ok: true, scheduleId: result.data.id }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api'); if (limited) return limited;
  const auth = await apiRequireAdmin(request); if (auth.error) return auth.error;
  const parsed = ChangeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid schedule update.' }, { status: 400 });
  const db = await requireAdminClient();
  const result = await db.from('billing_schedules').update({ status: parsed.data.status, updated_at: new Date().toISOString() }).eq('id', parsed.data.id).eq('provider', 'quickbooks').select('id').maybeSingle();
  if (result.error || !result.data) return NextResponse.json({ error: 'Billing schedule not found.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

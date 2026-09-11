import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';
import { createQuickBooksBillingProvider } from '@/lib/billing/providers/quickbooks';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CreateInvoiceSchema = z.object({
  idempotencyKey: z.string().trim().min(8).max(160),
  customer: z.object({
    externalKey: z.string().trim().min(1).max(160),
    displayName: z.string().trim().min(1).max(100),
    email: z.string().email(),
  }),
  dueDate: z.string().date(),
  memo: z.string().trim().max(500).optional(),
  lines: z.array(z.object({
    canonicalKey: z.string().trim().regex(/^[a-z0-9][a-z0-9_-]*$/).max(100),
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(4000).optional(),
    quantity: z.number().int().positive().max(1000),
    unitAmountCents: z.number().int().positive().max(100_000_000),
  })).min(1).max(50),
});

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const parsed = CreateInvoiceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid invoice request.', issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const db = await requireAdminClient();
    const invoice = await createQuickBooksBillingProvider(db).createManualInvoice(parsed.data);
    return NextResponse.json({ ok: true, invoice }, { status: 201 });
  } catch (error) {
    return safeInternalError(error, 'QuickBooks invoice creation failed');
  }
}

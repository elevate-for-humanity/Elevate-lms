// PUBLIC ROUTE: Supersonic professional-help inquiry; stores contact details, never a tax return.
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { taxJson } from '@/lib/tax-software/server/response';
export const runtime = 'nodejs';
const inquirySchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().max(30),
    service: z.enum([
      'personal',
      'self-employed',
      'business',
      'amended',
      'review',
      'free-preparation',
    ]),
    taxYear: z.number().int().min(2016).max(new Date().getUTCFullYear()),
    message: z.string().trim().min(10).max(1500),
  })
  .strict();
export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'contact');
  if (limited) return limited;
  const input = inquirySchema.safeParse(await req.json().catch(() => null));
  if (!input.success)
    return taxJson(
      { error: 'Review your contact details, tax year and request.' },
      { status: 400 },
    );
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(input.data.message))
    return taxJson(
      {
        error:
          'Remove Social Security numbers from this inquiry. Share only a general description.',
      },
      { status: 400 },
    );
  try {
    const db = await requireAdminClient();
    const { taxYear, ...details } = input.data;
    const saved = await db
      .from('tax_return_requests')
      .insert({
        tax_year: taxYear,
        status: 'submitted',
        payload: { ...details, kind: 'professional_inquiry', officeCode: 'SFC-IND-001' },
      })
      .select('id')
      .single();
    if (saved.error || !saved.data) throw Error('SAVE_FAILED');
    return taxJson({ ok: true, reference: saved.data.id }, { status: 201 });
  } catch {
    return taxJson(
      { error: 'Your request could not be saved. Please retry or call (463) 240-1404.' },
      { status: 503 },
    );
  }
}

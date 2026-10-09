import { ENCHANTED_HEARTS } from '@/lib/partners/enchanted-hearts';

export function schoolInvoiceSnapshot(payload: Record<string, any>) {
  const program = ENCHANTED_HEARTS.programs.find((item) => item.programId === payload.program_id);
  if (!program) return null;
  if (payload.program_holder_id !== ENCHANTED_HEARTS.programHolderId ||
      Number(payload.amount_cents) !== program.retailPriceCents) {
    throw new Error('School invoice order does not match the full tuition and assigned provider.');
  }
  return { program, schoolAmountCents: program.providerShareCents,
    elevateAmountCents: program.retailPriceCents - program.providerShareCents };
}

export async function recordSchoolInvoiceOrder(db: any, invoiceId: string, payload: Record<string, any>) {
  const snapshot = schoolInvoiceSnapshot(payload);
  if (!snapshot) return null;
  const invoice = await db.from('billing_invoices').select('status,total_cents')
    .eq('id', invoiceId).maybeSingle();
  if (invoice.error) throw new Error(invoice.error.message);
  if (invoice.data?.status !== 'paid' || Number(invoice.data.total_cents) !== snapshot.program.retailPriceCents)
    throw new Error('School invoice order requires confirmed full student payment.');
  const order = await db.from('school_invoice_orders').upsert({
    billing_invoice_id: invoiceId, enrollment_id: payload.enrollment_id,
    program_holder_id: payload.program_holder_id, program_id: payload.program_id,
    student_id: payload.student_id, retail_amount_cents: snapshot.program.retailPriceCents,
    school_amount_cents: snapshot.schoolAmountCents, elevate_amount_cents: snapshot.elevateAmountCents,
  }, { onConflict: 'billing_invoice_id', ignoreDuplicates: true });
  if (order.error) throw new Error(order.error.message);
  return snapshot;
}

import { HVAC_STORE_BUNDLE, HVAC_STORE_COURSE_ID } from './hvac-course-product';

/** Called only by verified paid-invoice fulfillment. Recheck the payment boundary
 * before creating an individual course enrollment; never enroll into hands-on training. */
export async function fulfillHvacCourseBundle(db: any, invoiceId: string, order: any) {
  const items = Array.isArray(order.items) ? order.items : [];
  const bundle = items.find((item: any) => item.product_id === HVAC_STORE_BUNDLE.id);
  if (!bundle) return;
  if (bundle.slug !== HVAC_STORE_BUNDLE.slug || bundle.quantity !== 1 ||
      bundle.unit_price_cents !== HVAC_STORE_BUNDLE.price * 100 || !order.user_id)
    throw new Error('HVAC bundle order snapshot is invalid.');
  const invoice = await db.from('billing_invoices')
    .select('id,status,paid_at,total_cents,fulfillment_type,fulfillment_payload')
    .eq('id', invoiceId).maybeSingle();
  const paid = invoice.data;
  if (invoice.error || !paid || paid.status !== 'paid' || !paid.paid_at ||
      paid.fulfillment_type !== 'store_order' ||
      paid.fulfillment_payload?.store_order_id !== order.id ||
      paid.fulfillment_payload?.user_id !== order.user_id ||
      Number(paid.total_cents) !== Number(order.total_cents))
    throw new Error('Verified paid HVAC invoice is required.');
  const existing = await db.from('course_enrollments').select('id,status,revoked_at')
    .eq('student_id', order.user_id).eq('course_id', HVAC_STORE_COURSE_ID).maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) {
    if (existing.data.revoked_at || !['active','enrolled','in_progress','confirmed','completed'].includes(existing.data.status))
      throw new Error('Existing HVAC enrollment requires staff review.');
    return;
  }
  const result = await db.from('course_enrollments').upsert({
    student_id: order.user_id, course_id: HVAC_STORE_COURSE_ID, status: 'active',
  }, { onConflict: 'student_id,course_id', ignoreDuplicates: true });
  if (result.error) throw new Error(result.error.message);
}

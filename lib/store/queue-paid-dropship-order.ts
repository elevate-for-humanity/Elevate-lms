import 'server-only';

/**
 * Fail-closed paid-order handoff into the canonical Supabase dropship queue.
 * This creates durable supplier-specific jobs; it does NOT claim supplier
 * submission, and the jobs remain pending until an authenticated worker
 * submits them and records the supplier's acknowledgment.
 */
export async function queuePaidDropshipOrder(db: any, order: {
  id: string;
  items: any[];
}) {
  const physical = order.items.filter((item) => item.requires_shipping === true);
  if (!physical.length) return;
  const ids = [...new Set(physical.map((item) => item.product_id))];
  const { data: mappings, error } = await db.from('dropship_skus')
    .select('product_id,supplier_id,supplier_sku,enabled,supplier:dropship_suppliers(enabled,integration_type,free_account_verified)')
    .in('product_id', ids).eq('enabled', true);
  if (error) throw new Error(`Dropship mapping lookup failed: ${error.message}`);
  const byProduct = new Map<string, any>();
  for (const mapping of mappings || []) {
    const supplier = Array.isArray(mapping.supplier) ? mapping.supplier[0] : mapping.supplier;
    if (!supplier?.enabled || !supplier.free_account_verified || supplier.integration_type !== 'api') continue;
    if (byProduct.has(mapping.product_id)) throw new Error('Multiple active suppliers mapped to one product.');
    byProduct.set(mapping.product_id, mapping);
  }
  if (physical.some((item) => !byProduct.has(item.product_id))) {
    throw new Error('Paid order contains physical products without verified automatic fulfillment.');
  }
  const grouped = new Map<string, any[]>();
  for (const item of physical) {
    const mapping = byProduct.get(item.product_id);
    const group = grouped.get(mapping.supplier_id) || [];
    group.push({ product_id: item.product_id, supplier_sku: mapping.supplier_sku, quantity: item.quantity });
    grouped.set(mapping.supplier_id, group);
  }
  for (const [supplierId, items] of grouped) {
    const { error: upsertError } = await db.from('dropship_fulfillments').upsert({
      store_order_id: order.id,
      supplier_id: supplierId,
      idempotency_key: `dropship:${order.id}:${supplierId}`,
      items,
      status: 'pending',
    }, { onConflict: 'store_order_id,supplier_id', ignoreDuplicates: true });
    if (upsertError) throw new Error(`Dropship queue write failed: ${upsertError.message}`);
  }
}

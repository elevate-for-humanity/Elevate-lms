// Compare billable content, not just the total: different products can have
// identical prices. Reordering the same cart is safe for an idempotent retry.
export function checkoutSnapshotsMatch(saved, current) {
  const normalize = items => {
    if (!Array.isArray(items) || !items.length) return null;
    const rows = items.map(item => {
      if (!item || typeof item.product_id !== 'string' || !item.product_id ||
          !Number.isSafeInteger(item.quantity) || item.quantity < 1 ||
          !Number.isSafeInteger(item.unit_price_cents) || item.unit_price_cents < 1)
        return null;
      return [item.product_id, item.quantity, item.unit_price_cents,
        item.type ?? null, Boolean(item.requires_shipping), Boolean(item.track_inventory)];
    });
    if (rows.some(row => row === null)) return null;
    return JSON.stringify(rows.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
  };
  const left = normalize(saved), right = normalize(current);
  return left !== null && right !== null && left === right;
}

/** Decode the single-snapshot, USD-cent database contract without guessing
 * units or falling back to larger overlapping payment snapshots. */
export function decodePaidInvoiceTotals(rows) {
  if (!Array.isArray(rows) || rows.length!==1 || !rows[0]) throw Error('PAID_INVOICE_TOTALS_UNAVAILABLE');
  const row=rows[0];
  const integer=value=>{
    if (!['number','string'].includes(typeof value) ||
        (typeof value==='string' && !/^\d+$/.test(value))) throw Error('PAID_INVOICE_TOTAL_INVALID');
    const number=Number(value);
    if (!Number.isSafeInteger(number) || number<0) throw Error('PAID_INVOICE_TOTAL_INVALID');
    return number;
  };
  const allTimeCents=integer(row.all_time_cents),thisMonthCents=integer(row.this_month_cents),paidCount=integer(row.paid_count);
  if (thisMonthCents>allTimeCents) throw Error('PAID_INVOICE_TOTAL_INCONSISTENT');
  return {allTimeCents,thisMonthCents,paidCount,
    allTimeAvailable:row.all_time_available===true,
    monthAvailable:row.all_time_available===true && row.month_available===true};
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {decodePaidInvoiceTotals} from '../../lib/admin/dashboard/paid-invoice-totals.mjs';
const snapshot=(extra={})=>[{all_time_cents:'60000',this_month_cents:'30000',paid_count:2,all_time_available:true,month_available:true,...extra}];
test('preserves explicit cents without multiplying by one hundred',()=>{
 const value=decodePaidInvoiceTotals(snapshot());assert.equal(value.allTimeCents,60000);assert.equal(value.thisMonthCents,30000);assert.equal(value.paidCount,2);
});
test('missing, ambiguous or multiple snapshots cannot become a false zero',()=>{
 for(const rows of [null,[],[null],[{},{}]])assert.throws(()=>decodePaidInvoiceTotals(rows),/UNAVAILABLE/);
});
test('malformed, negative, fractional and unsafe amounts are rejected',()=>{
 for(const value of [null,undefined,'',-1,1.5,'60.00','1e3',Number.MAX_SAFE_INTEGER+1])
  assert.throws(()=>decodePaidInvoiceTotals(snapshot({all_time_cents:value})),/INVALID/);
});
test('monthly value cannot exceed its all-time snapshot',()=>{
 assert.throws(()=>decodePaidInvoiceTotals(snapshot({this_month_cents:'60001'})),/INCONSISTENT/);
});
test('unknown dates and unverified amount contracts retain unavailable state',()=>{
 assert.equal(decodePaidInvoiceTotals(snapshot({month_available:false})).monthAvailable,false);
 const unknown=decodePaidInvoiceTotals(snapshot({all_time_available:false}));assert.equal(unknown.allTimeAvailable,false);assert.equal(unknown.monthAvailable,false);
});

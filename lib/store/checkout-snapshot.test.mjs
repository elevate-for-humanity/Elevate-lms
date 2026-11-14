import test from 'node:test';
import assert from 'node:assert/strict';
import { checkoutSnapshotsMatch } from './checkout-snapshot.mjs';
const item = (id, quantity = 1, price = 9000) => ({product_id:id,quantity,unit_price_cents:price,type:'digital',requires_shipping:false,track_inventory:false});
test('same-price substitutions cannot reuse a previously invoiced checkout',()=>{
  assert.equal(checkoutSnapshotsMatch([item('barber')],[item('cosmetology')]),false);
});
test('reordered identical items can retry without creating another invoice',()=>{
  assert.equal(checkoutSnapshotsMatch([item('a'),item('b',2)],[item('b',2),item('a')]),true);
});
test('quantities, price, fulfillment type and inventory changes require a new checkout',()=>{
  for (const changed of [item('a',2,4500),item('a',1,8900),{...item('a'),type:'physical'},
    {...item('a'),requires_shipping:true},{...item('a'),track_inventory:true}])
    assert.equal(checkoutSnapshotsMatch([item('a')],[changed]),false);
});
test('missing and malformed snapshots cannot certify checkout retries',()=>{
  for (const value of [null,[],[null],[{}],[item('a',0)],[item('a',1,NaN)]])
    assert.equal(checkoutSnapshotsMatch(value,[item('a')]),false);
});

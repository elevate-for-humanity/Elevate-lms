import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const productSource = stripTypeScriptTypes(readFileSync(new URL('../../lib/store/hvac-course-product.ts',import.meta.url),'utf8'),{mode:'transform'});
const productUrl = 'data:text/javascript;base64,'+Buffer.from(productSource).toString('base64');
const {HVAC_STORE_BUNDLE,HVAC_STORE_COURSE_ID}=await import(productUrl);
const source=stripTypeScriptTypes(readFileSync(new URL('../../lib/store/fulfill-hvac-course.ts',import.meta.url),'utf8'),{mode:'transform'}).replace("'./hvac-course-product'",JSON.stringify(productUrl));
const {fulfillHvacCourseBundle}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

function harness({paid=true,otherBuyer=false,existing=null,invoiceError=false}={}) {
  const order={id:'order-one',user_id:'buyer-one',total_cents:18200,items:[{product_id:HVAC_STORE_BUNDLE.id,slug:HVAC_STORE_BUNDLE.slug,quantity:1,unit_price_cents:18200}]};
  const invoice={id:'invoice-one',status:paid?'paid':'open',paid_at:paid?'2026-11-02T00:00:00Z':null,total_cents:18200,fulfillment_type:'store_order',fulfillment_payload:{store_order_id:order.id,user_id:otherBuyer?'someone-else':order.user_id}};
  const writes=[];
  const db={from(table){return {select(){return this},eq(){return this},async maybeSingle(){return table==='billing_invoices'?{data:invoice,error:invoiceError?{message:'offline'}:null}:{data:existing,error:null}},async upsert(row,options){writes.push({row,options});return {error:null}}}}};
  return {db,order,writes};
}
test('an exact verified paid purchase grants only its buyer the digital course',async()=>{const h=harness();await fulfillHvacCourseBundle(h.db,'invoice-one',h.order);assert.equal(h.writes.length,1);assert.deepEqual(h.writes[0].row,{student_id:'buyer-one',course_id:HVAC_STORE_COURSE_ID,status:'active'});assert.equal(h.writes[0].options.ignoreDuplicates,true)});
test('unpaid, mismatched and unavailable invoices never grant enrollment',async()=>{for(const config of [{paid:false},{otherBuyer:true},{invoiceError:true}]){const h=harness(config);await assert.rejects(fulfillHvacCourseBundle(h.db,'invoice-one',h.order));assert.equal(h.writes.length,0)}});
test('altered quantity or price cannot grant course access',async()=>{for(const patch of [{quantity:2},{unit_price_cents:1},{slug:'other-product'}]){const h=harness();Object.assign(h.order.items[0],patch);await assert.rejects(fulfillHvacCourseBundle(h.db,'invoice-one',h.order));assert.equal(h.writes.length,0)}});
test('existing learner progress and completed enrollment are preserved',async()=>{for(const status of ['active','completed']){const h=harness({existing:{id:'existing',status,revoked_at:null}});await fulfillHvacCourseBundle(h.db,'invoice-one',h.order);assert.equal(h.writes.length,0)}});
test('a revoked enrollment requires review and unrelated purchases are untouched',async()=>{const h=harness({existing:{id:'existing',status:'active',revoked_at:'2026-10-01'}});await assert.rejects(fulfillHvacCourseBundle(h.db,'invoice-one',h.order));assert.equal(h.writes.length,0);h.order.items=[];await fulfillHvacCourseBundle(h.db,'invoice-one',h.order);assert.equal(h.writes.length,0)});

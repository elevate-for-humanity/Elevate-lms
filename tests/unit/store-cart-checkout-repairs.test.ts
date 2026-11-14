import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({
  stored: [] as any[], products: [] as any[], prior: null as any, invoices: [] as any[], inserted: [] as any[],
}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'buyer',email:'buyer@example.test'}}})}})}));
vi.mock('@/lib/logger',()=>({logger:{error:vi.fn()}}));
vi.mock('@/lib/billing/providers/quickbooks',()=>({createQuickBooksBillingProvider:()=>({createManualInvoice:async(input:any)=>{
 state.invoices.push(input);return {paymentUrl:'https://invoice.example.test/pay',providerInvoiceId:'invoice'};
}})}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:(table:string)=>{
 let op='read';const q:any={select:()=>q,eq:()=>q,in:()=>q,order:()=>q,update:()=>{op='update';return q;},
 insert:(row:any)=>{op='insert';state.inserted.push(row);return q;},
 maybeSingle:async()=>({data:table==='store_orders'?state.prior:{full_name:'Test buyer'},error:null}),
 single:async()=>({data:{id:'order'},error:null}),
 then:(resolve:any)=>Promise.resolve({data:op==='update'?null:table==='cart_items'?state.stored:table==='products'?state.products:[],error:null}).then(resolve),
 };return q;
}})}));
import { POST } from '@/apps/marketing/app/api/store/cart-checkout/route';
const product=(id:string)=>({id,slug:id,name:id,price:90,price_cents:9000,currency:'USD',type:'digital',is_active:true,requires_shipping:false,track_inventory:false});
const attempt='12345678-1234-1234-1234-123456789abc';
const request=(items:any,accept='application/json')=>new NextRequest('https://store.example.test/api/store/cart-checkout',{
 method:'POST',headers:{'Content-Type':'application/json',Accept:accept},body:JSON.stringify({items,checkoutAttemptId:attempt}),
});
beforeEach(()=>{state.stored=[];state.products=[product('current')];state.prior=null;state.invoices=[];state.inserted=[];});
it('invoices the displayed browser cart even when an older saved cart exists',async()=>{
 state.stored=[{id:'old',quantity:1,product:product('old')}];
 const response=await POST(request([{slug:'current',quantity:2}]));
 expect(response.status).toBe(200);expect(await response.json()).toMatchObject({checkoutUrl:'https://invoice.example.test/pay'});
 expect(state.invoices[0].lines).toEqual([expect.objectContaining({name:'current',quantity:2,unitAmountCents:9000})]);
});
it.each([[null],[{slug:'current',quantity:0}],[{slug:'current',quantity:1.5}],[{slug:'current'},{}],[]])('rejects malformed cart items without creating invoices: %j',async(...items)=>{
 expect((await POST(request(items))).status).toBe(400);expect(state.invoices).toHaveLength(0);
});
it('rejects duplicate products before billing',async()=>{
 expect((await POST(request([{slug:'current'},{slug:'current'}]))).status).toBe(400);
 expect(state.invoices).toHaveLength(0);
});
it('cannot reuse a checkout attempt for a different product with the same price',async()=>{
 state.prior={id:'old-order',user_id:'buyer',total_cents:9000,items:[{product_id:'old',quantity:1,unit_price_cents:9000,type:'digital',requires_shipping:false,track_inventory:false}]};
 expect((await POST(request([{slug:'current'}]))).status).toBe(409);expect(state.invoices).toHaveLength(0);
});
it('can retry an unchanged cart with the same order and invoice idempotency key',async()=>{
 state.prior={id:'old-order',user_id:'buyer',total_cents:9000,items:[{product_id:'current',quantity:1,unit_price_cents:9000,type:'digital',requires_shipping:false,track_inventory:false}]};
 expect((await POST(request([{slug:'current'}]))).status).toBe(200);
 expect(state.inserted).toHaveLength(0);expect(state.invoices[0].idempotencyKey).toBe('store-order:old-order');
});

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const state=vi.hoisted(()=>({user:{id:'buyer'} as any,orders:[] as any[],access:[] as any[],error:false,filters:[] as any[]}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{getUser:async()=>({data:{user:state.user}})}})}));
vi.mock('next/navigation',()=>({redirect:(url:string)=>{throw Error('redirect:'+url);}}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:(table:string)=>{
 const q:any={select:()=>q,eq:(key:string,value:any)=>{state.filters.push({table,key,value});return q;},order:()=>q,limit:()=>q,
 then:(resolve:any)=>Promise.resolve({data:table==='store_orders'?state.orders:state.access,error:state.error?new Error('test'):null}).then(resolve)};return q;
}})}));
import Orders from '@/apps/marketing/app/store/orders/page';
import Success from '@/apps/marketing/app/store/success/page';
beforeEach(()=>{state.user={id:'buyer'};state.orders=[];state.access=[];state.filters=[];state.error=false;});
afterEach(cleanup);
it('keeps unpaid orders pending and scopes all reads to the signed-in buyer',async()=>{
 state.orders=[{id:'order',status:'pending',total_cents:9000,items:[{product_id:'p',name:'Workbook',quantity:1,unit_price_cents:9000}]}];
 render(await Orders({searchParams:Promise.resolve({})}));
 expect(screen.getByText('Awaiting payment confirmation')).toBeInTheDocument();
 expect(screen.queryByText('Payment received')).not.toBeInTheDocument();
 for(const table of ['store_orders','user_entitlements'])expect(state.filters).toContainEqual({table,key:'user_id',value:'buyer'});
 expect(state.filters).toContainEqual({table:'user_entitlements',key:'status',value:'active'});
});
it('shows verified paid orders and active purchases',async()=>{
 state.orders=[{id:'order',status:'paid',total_cents:9000,items:[]}];state.access=[{id:'e',product_id:'p',name:'Workbook',status:'active'}];
 render(await Orders({searchParams:Promise.resolve({})}));
 expect(screen.getByText('Payment received')).toBeInTheDocument();expect(screen.getByText('Active access')).toBeInTheDocument();
});
it('does not report payment success on database failure',async()=>{
 state.error=true;render(await Orders({searchParams:Promise.resolve({})}));
 expect(screen.getByRole('alert')).toHaveTextContent('could not load');expect(screen.queryByText('Payment received')).not.toBeInTheDocument();
});
it('requires login and preserves the requested order',async()=>{
 state.user=null;await expect(Orders({searchParams:Promise.resolve({order_id:'order'})})).rejects.toThrow('redirect:/login?redirect=%2Fstore%2Forders%3Forder_id%3Dorder');expect(state.filters).toHaveLength(0);
});
it('legacy success URLs redirect to verified account status without granting access',async()=>{
 await expect(Success({searchParams:Promise.resolve({order_id:'order'})})).rejects.toThrow('redirect:/store/orders?order_id=order');
});

it('links the purchased workbook to the matching LMS account resource',async()=>{
 state.access=[{id:'e',product_id:'381aff7f-7fdc-58bd-8b65-0d07f4f411ec',name:'Cosmetology Apprenticeship Workbook',status:'active'}];
 render(await Orders({searchParams:Promise.resolve({})}));
 expect(screen.getByRole('link',{name:'Open workbook'})).toHaveAttribute('href','https://app.elevateforhumanity.org/workbooks/prestige-elevation-cosmetology');
});

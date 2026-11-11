import {beforeEach,describe,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
const fixture=vi.hoisted(()=>({row:{title:'Nail Technician Apprenticeship',price:6000,tuition:6000,total_cost:6000},tables:[] as string[]}));
vi.mock('@/lib/api/withRateLimit',()=>({applyRateLimit:async()=>null}));
vi.mock('@/lib/supabase/public',()=>({createPublicClient:()=>({from:(table:string)=>{fixture.tables.push(table);const query={select:()=>query,eq:()=>query,maybeSingle:async()=>({data:fixture.row,error:null})};return query;}})}));
import {GET} from '@/apps/marketing/app/api/programs/pricing/route';
describe('apprenticeship public price authority',()=>{
 beforeEach(()=>{fixture.tables=[];});
 it('uses the same program price as invoice checkout instead of a legacy pricing table',async()=>{
   const result=await GET(new NextRequest('https://www.elevateforhumanity.org/api/programs/pricing?slug=nail-technician-apprenticeship'));
   const data=await result.json();
   expect(data.tuition_cents).toBe(600000);
   expect(data.deposit_default_cents).toBe(60000);
   expect(data.payment_frequency).toBe('monthly');
   expect(fixture.tables).toEqual(['programs']);
 });
 it('publishes the barber $600 deposit and 29-week schedule used by checkout',async()=>{
   fixture.row={title:'Barber Apprenticeship',price:4980,tuition:4980,total_cost:4980};
   const result=await GET(new NextRequest('https://www.elevateforhumanity.org/api/programs/pricing?slug=barber-apprenticeship'));
   expect(await result.json()).toMatchObject({tuition_cents:498000,deposit_default_cents:60000,payment_frequency:'weekly',payment_weeks:29});
 });
});

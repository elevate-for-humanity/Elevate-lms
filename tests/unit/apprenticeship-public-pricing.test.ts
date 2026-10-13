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
   expect(data.deposit_default_cents).toBe(150000);
   expect(data.payment_frequency).toBe('monthly');
   expect(fixture.tables).toEqual(['programs']);
 });
});

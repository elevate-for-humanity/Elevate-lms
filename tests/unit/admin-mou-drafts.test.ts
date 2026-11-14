import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state=vi.hoisted(()=>({authError:null as any,templateContent:'',signed:false,stale:false,insert:vi.fn(),update:vi.fn(),partnerFound:true}));
const full='The parties agree to the training scope, participant support, records, privacy, delivery responsibilities and review process. Payment obligations are governed by the attached approved schedule. Changes require written approval by both parties. This is an unsigned draft for review.';
vi.mock('@/lib/api/withRateLimit',()=>({applyRateLimit:async()=>null}));
vi.mock('@/lib/admin/guards',()=>({apiRequireAdmin:async()=>({userId:'owner',error:state.authError})}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:(table:string)=>{
 let writing=false;const q:any={select:()=>q,eq:()=>q,is:()=>q,insert:(v:any)=>{writing=true;state.insert(v);return q;},update:(v:any)=>{writing=true;state.update(v);return q;},single:async()=>({data:{id:'created',status:'pending'},error:null}),maybeSingle:async()=>{
 if(table==='partners')return {data:state.partnerFound?{id:'11111111-1111-4111-8111-111111111111',name:'Partner'}:null,error:null};
 if(table==='mou_templates')return {data:{id:'22222222-2222-4222-8222-222222222222',name:'Template',content:state.templateContent},error:null};
 return {data:writing?(state.stale?null:{id:'saved'}):{id:'record',status:state.signed?'signed':'pending',signed_at:state.signed?'2026-01-01':null,terms:{content:'old'},updated_at:'version'},error:null};
 }};return q;
}})}));
import {POST,PATCH} from '@/apps/admin/app/api/admin/mou/route';
const req=(body:unknown,method='POST')=>new NextRequest('https://admin.elevateforhumanity.org/api/admin/mou',{method,headers:{'content-type':'application/json'},body:JSON.stringify(body)});
const draft={action:'create',partner_id:'11111111-1111-4111-8111-111111111111',title:'Training agreement',content:full};
beforeEach(()=>{vi.clearAllMocks();state.authError=null;state.signed=false;state.stale=false;state.partnerFound=true;state.templateContent=full;});
it('saves complete terms as an unsigned draft without claiming email delivery',async()=>{const result=await POST(req(draft));expect(result.status).toBe(201);expect(await result.json()).toMatchObject({emailSent:false,mou:{status:'pending'}});expect(state.insert).toHaveBeenCalledWith(expect.objectContaining({status:'pending',terms:expect.objectContaining({content:full,draft:true,created_by:'owner'})}));});
it.each(['','This Memorandum of Understanding is entered into between Elevate and the provider.','{{company name}} '+full])('does not save incomplete agreement text',async content=>{expect((await POST(req({...draft,content}))).status).toBe(400);expect(state.insert).not.toHaveBeenCalled();});
it('does not turn an introductory template into a complete contract',async()=>{state.templateContent='Introduction only';expect((await POST(req({...draft,template_id:'22222222-2222-4222-8222-222222222222'}))).status).toBe(400);expect(state.insert).not.toHaveBeenCalled();});
it('requires an existing partner rather than inventing one from free text',async()=>{state.partnerFound=false;expect((await POST(req(draft))).status).toBe(404);expect(state.insert).not.toHaveBeenCalled();});
it('retains the authorization boundary',async()=>{state.authError=Response.json({error:'Authentication required'},{status:401});expect((await POST(req(draft))).status).toBe(401);expect(state.insert).not.toHaveBeenCalled();});
it('cannot edit an executed agreement',async()=>{state.signed=true;expect((await PATCH(req({...draft,id:draft.partner_id,updated_at:'version'},'PATCH'))).status).toBe(409);expect(state.update).not.toHaveBeenCalled();});
it('does not overwrite a concurrently changed draft',async()=>{state.stale=true;expect((await PATCH(req({...draft,id:draft.partner_id,updated_at:'version'},'PATCH'))).status).toBe(409);});

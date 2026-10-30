import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const fixture=vi.hoisted(()=>({ updates: [] as any[], contextError:false, saved:true }));
vi.mock('@/lib/api/withRateLimit',()=>({applyRateLimit:async()=>null}));
vi.mock('@/lib/partners/current-host-shop',()=>({requireCurrentHostShopPartner:async()=>{
  if(fixture.contextError) throw new Error('HOST_SHOP_UNAUTHENTICATED');
  return {partner:{id:'selected-shop'},db:{from:()=>({update:(value:any)=>{fixture.updates.push(value);return {eq:(key:string,id:string)=>{expect(key).toBe('id');expect(id).toBe('selected-shop');return {select:()=>({maybeSingle:async()=>({data:fixture.saved?{id}:null,error:null})})};}};}})}};
}}));
import { PATCH } from '@/apps/lms/app/api/partner/settings/route';
const body={orgId:'untrusted-other-shop',name:'Salon Saloon',address:'Business address',city:'South Bend',state:'in',contact_name:'Owner',contact_email:'owner@example.org',contact_phone:'3170000000',notification_preferences:{email:true,weekly_digest:false,outcome_alerts:true,referral_confirmations:true}};
const request=(data:any)=>new NextRequest('https://app.elevateforhumanity.org/api/partner/settings',{method:'PATCH',body:JSON.stringify(data),headers:{'content-type':'application/json'}});
describe('Host Shop settings save',()=>{
 beforeEach(()=>{fixture.updates=[];fixture.contextError=false;fixture.saved=true;});
 it('updates only the server-selected shop regardless of posted orgId',async()=>{expect((await PATCH(request(body))).status).toBe(200);expect(fixture.updates[0].state).toBe('IN');expect(fixture.updates[0].address_line1).toBe(body.address);});
 it('rejects malformed preferences before touching a partner record',async()=>{expect((await PATCH(request({...body,notification_preferences:{email:'yes'}}))).status).toBe(400);expect(fixture.updates).toEqual([]);});
 it('requires an authenticated shop context',async()=>{fixture.contextError=true;expect((await PATCH(request(body))).status).toBe(401);expect(fixture.updates).toEqual([]);});
 it('does not report success when no row was updated',async()=>{fixture.saved=false;expect((await PATCH(request(body))).status).toBe(500);});
});

import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only',()=>({}));
const mock=vi.hoisted(()=>({actor:vi.fn()}));
vi.mock('@/lib/phone/actor-response',()=>({phoneActorResponse:mock.actor}));
vi.mock('@/components/program-holder/ProgramHolderPhoneReceiver',()=>({ProgramHolderPhoneReceiver:()=>null}));
import { AutomaticPhone } from '@/components/communications/AutomaticPhone';
const owner={user:{id:'owner'},previewing:false,extension:{enabled:true},system:{status:'active'},roles:['program_holder']};
beforeEach(()=>mock.actor.mockResolvedValue({actor:owner}));
it.each([
 ['signed out',{response:new Response(null,{status:401})}],
 ['preview',{actor:{...owner,previewing:true}}],
 ['unassigned',{actor:{...owner,extension:null}}],
 ['disabled',{actor:{...owner,extension:{enabled:false}}}],
 ['inactive system',{actor:{...owner,system:{status:'inactive'}}}],
])('does not activate a device for %s',async(_label,result)=>{mock.actor.mockResolvedValue(result);expect(await AutomaticPhone({})).toBeNull();});
it.each([
 [['program_holder'],'/communications/phone'],
 [['site_coordinator'],'/communications/phone'],
 [['host_shop'],'/communications/phone'],
 [['partner'],'/communications/phone'],
 [['instructor'],'/communications/phone'],
])('automatically activates the assigned %s owner',async(roles,href)=>{mock.actor.mockResolvedValue({actor:{...owner,roles}});const result=await AutomaticPhone({});expect(result?.key).toBe('owner');expect(result?.props.phoneHref).toBe(href);});
it('keeps the admin phone on its own origin',async()=>{const result=await AutomaticPhone({admin:true});expect(result?.props.phoneHref).toBe('/phone/dial-pad');});

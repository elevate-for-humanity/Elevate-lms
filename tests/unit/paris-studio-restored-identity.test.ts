import {afterEach,expect,it,vi} from 'vitest';
vi.mock('@/lib/supabase/client',()=>({createClient:()=>({})}));
import {OpenStudioAgent} from '@/lib/studio/agent';
import {PARIS_SYSTEM_IDENTITY} from '@/lib/ai/paris-identity';
afterEach(()=>window.localStorage.clear());
it('restoring Studio preserves the conversation and replaces historical system identities with PARIS',async()=>{
 const history=[{id:'old-system',role:'system',content:'You are Ellie',timestamp:1},{id:'user',role:'user',content:'Resume my course',timestamp:2},{id:'assistant',role:'assistant',content:'Saved checkpoint',timestamp:3}];
 window.localStorage.setItem('openstudio_session',JSON.stringify({id:'saved-session',messages:history}));
 const agent=new OpenStudioAgent({model:'canonical'});await agent.initialize();
 expect(agent.getSessionId()).toBe('saved-session');expect(agent.getMessages().filter(m=>m.role==='system')).toHaveLength(1);
 expect(agent.getMessages()[0].content).toContain(PARIS_SYSTEM_IDENTITY);expect(agent.getMessages().slice(1)).toEqual(history.slice(1));
 await agent.initialize();expect(agent.getMessages().filter(m=>m.role==='system')).toHaveLength(1);
});

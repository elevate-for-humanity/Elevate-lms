import {act,cleanup,render,screen,waitFor} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
const h=vi.hoisted(()=>({auth:null as any,finish:null as any,reads:0,signal:null as AbortSignal|null,user:null as any}));
vi.mock('next/navigation',()=>({usePathname:()=>'/employer/dashboard'}));
vi.mock('@/components/notifications/PwaAlertListener',()=>({PwaAlertListener:()=>null}));
vi.mock('@/lib/supabase/client',()=>({createClient:()=>{
 const q:any={};
 for(const method of ['select','eq','in','or','order','limit'])q[method]=()=>q;
 q.abortSignal=(signal:AbortSignal)=>{h.signal=signal;h.reads++;return new Promise(resolve=>{h.finish=resolve;});};
 const channel:any={on:()=>channel,subscribe:()=>channel};
 return {auth:{getUser:()=>h.user??Promise.resolve({data:{user:{id:'fixture'}}}),onAuthStateChange:(callback:any)=>{h.auth=callback;return {data:{subscription:{unsubscribe:vi.fn()}}};}},from:()=>q,channel:()=>channel,removeChannel:vi.fn()};
}}));
import {CommunicationTodos} from '@/components/communications/CommunicationTodos';
beforeEach(()=>{h.reads=0;h.signal=null;h.user=null;h.finish=null;});
afterEach(cleanup);
it('coalesces overlapping auth reads and explicitly cancels the notification request when leaving the page',async()=>{
 const view=render(<CommunicationTodos/>);
 await waitFor(()=>expect(h.reads).toBe(1));
 act(()=>h.auth());
 await act(async()=>{await new Promise(resolve=>setTimeout(resolve,10));});
 expect(h.reads).toBe(1);
 view.unmount();
 expect(h.signal?.aborted).toBe(true);
 await act(async()=>h.finish({data:[],error:null}));
});
it('does not begin a stale read after authentication completes on an unmounted page',async()=>{
 let finish:any;h.user=new Promise(resolve=>{finish=resolve;});
 const view=render(<CommunicationTodos/>);view.unmount();
 await act(async()=>finish({data:{user:{id:'fixture'}}}));
 expect(h.reads).toBe(0);
});
it('shows active notification failures instead of reporting an empty successful inbox',async()=>{
 render(<CommunicationTodos/>);
 await waitFor(()=>expect(h.reads).toBe(1));
 await act(async()=>h.finish({data:null,error:{message:'Network failure'}}));
 expect(await screen.findByRole('status')).toHaveTextContent('temporarily unavailable');
});

import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import TasksClient from '@/apps/admin/app/studio/tasks/TasksClient';

afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('retains provider confirmation instructions after the task list refreshes without replaying approval',async()=>{
 const message='Confirm the pending action in the original OpenHands conversation. The existing provider task was not replayed.';
 const fetcher=vi.fn(async(_url:string,init?:RequestInit)=>init?.method==='POST'
  ? Response.json({error:message,code:'OPENHANDS_PROVIDER_CONFIRMATION_REQUIRED'},{status:409})
  : Response.json({tasks:[{id:'original',title:'Original repair',status:'awaiting_approval',priority:'normal',
    requires_approval:true,created_at:'2026-11-22T10:00:00Z',ai_agents:null}]}));
 vi.stubGlobal('fetch',fetcher);
 render(<TasksClient embedded/>);
 fireEvent.click(await screen.findByRole('button',{name:/Approve/}));
 expect(await screen.findByRole('alert')).toHaveTextContent(message);
 fireEvent.click(screen.getByRole('button',{name:'Refresh'}));
 await waitFor(()=>expect(fetcher.mock.calls.filter(([,init])=>!init?.method)).toHaveLength(2));
 expect(screen.getByRole('alert')).toHaveTextContent(message);
 expect(fetcher.mock.calls.filter(([,init])=>init?.method==='POST')).toHaveLength(1);
});
it('reports an unreadable failed approval without exposing response bodies',async()=>{
 vi.stubGlobal('fetch',vi.fn(async(_url:string,init?:RequestInit)=>init?.method==='POST'
  ? new Response('private gateway details',{status:502})
  : Response.json({tasks:[{id:'original',title:'Original repair',status:'awaiting_approval',priority:'normal',
    requires_approval:true,created_at:'2026-11-22T10:00:00Z',ai_agents:null}]})));
 render(<TasksClient embedded/>);
 fireEvent.click(await screen.findByRole('button',{name:/Approve/}));
 expect(await screen.findByRole('alert')).toHaveTextContent('Task approval could not be confirmed.');
 expect(screen.queryByText(/private gateway/)).toBeNull();
});

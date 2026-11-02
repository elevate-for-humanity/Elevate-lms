import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
const state=vi.hoisted(()=>({refresh:vi.fn()}));
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:state.refresh})}));
import {CompleteChecklistButton} from '@/apps/admin/app/staff-portal/qa-checklist/CompleteChecklistButton';
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.clearAllMocks();});
it('refreshes the saved checklist only after a confirmed completion record',async()=>{
 const request=vi.fn().mockResolvedValue({ok:true,json:async()=>({completion:{id:'record'}})});vi.stubGlobal('fetch',request);
 render(<CompleteChecklistButton checklistId="checklist"/>);fireEvent.click(screen.getByRole('button',{name:'Mark as Complete'}));
 await waitFor(()=>expect(state.refresh).toHaveBeenCalledOnce());expect(JSON.parse(request.mock.calls[0][1].body)).toEqual({checklist_id:'checklist'});
});
it('keeps an unsuccessful completion visibly pending with a retryable error',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,json:async()=>({error:'Save unavailable'})}));
 render(<CompleteChecklistButton checklistId="checklist"/>);fireEvent.click(screen.getByRole('button',{name:'Mark as Complete'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('Save unavailable');expect(state.refresh).not.toHaveBeenCalled();expect(screen.getByRole('button')).toBeEnabled();
});

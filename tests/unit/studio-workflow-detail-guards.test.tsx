import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WorkflowDetailClient from '@/apps/admin/app/studio/workflows/[id]/WorkflowDetailClient';
vi.mock('next/navigation', () => ({useRouter: () => ({refresh: vi.fn()})}));
const workflow = {id:'empty', name:'Welcome', workflow_key:'welcome', category:'system', status:'active', last_run_at:null, last_run_status:null, run_count:0, metadata:{}};
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe('workflow detail execution guards', () => {
  it('shows an active but empty record as incomplete with a single disabled Run button', () => {
    render(<WorkflowDetailClient workflow={workflow} steps={[]} triggers={[]} runs={[]} />);
    expect(screen.getByText('incomplete')).toBeInTheDocument();
    expect(screen.getAllByRole('button', {name:'Run Now'})).toHaveLength(1);
    expect(screen.getByRole('button', {name:'Run Now'})).toBeDisabled();
  });
  it('does not optimistically activate when the server rejects configuration', async () => {
    const request = vi.fn().mockResolvedValue({ok:false,json:async()=>({error:'Enabled trigger is required'})});
    vi.stubGlobal('fetch',request);
    render(<WorkflowDetailClient workflow={{...workflow,status:'inactive'}} steps={[{id:'s',workflow_id:'empty',step_order:1,action_type:'send_notification',action_config:{},enabled:true}]} triggers={[{id:'t',workflow_id:'empty',trigger_type:'manual',event_filter:{},cron_expr:null,enabled:true}]} runs={[]} />);
    fireEvent.click(screen.getByRole('button',{name:'Activate'}));
    await waitFor(()=>expect(screen.getByText('Enabled trigger is required')).toBeInTheDocument());
    expect(screen.getByRole('button',{name:'Activate'})).toBeEnabled();
    expect(screen.getByText('inactive')).toBeInTheDocument();
  });
});

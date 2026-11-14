// @vitest-environment jsdom
import {createElement} from 'react';
import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import WorkflowRepairReview from '@/components/paris/WorkflowRepairReview';

const pending = {
  id: '22222222-2222-4222-8222-222222222222', target_service: 'document_upload',
  status: 'pending', approval_status: 'pending', parameters: {incident_id: 'incident-1'},
  incident: {title: 'Document upload failed', description: 'The saved document was not accepted.', status: 'identified'},
};
let request: ReturnType<typeof vi.fn>;

beforeEach(() => {
  request = vi.fn();
  vi.stubGlobal('fetch', request);
});
afterEach(() => {cleanup(); vi.unstubAllGlobals();});

describe('workflow repair review interface', () => {
  it('shows saved evidence and waits for explicit approval before queueing a repair', async () => {
    request.mockResolvedValueOnce(Response.json({workflowRepairs: [pending]}))
      .mockResolvedValueOnce(Response.json({repairId: 'repair-1', status: 'queued', verified: false}, {status: 202}))
      .mockResolvedValueOnce(Response.json({workflowRepairs: [{...pending,
        approval_status: 'approved', status: 'running', result: {repairId: 'repair-1', status: 'queued', verified: false},
      }]}));
    render(createElement(WorkflowRepairReview));
    expect(await screen.findByText('Document upload failed')).toBeTruthy();
    expect(screen.getByText('The saved document was not accepted.')).toBeTruthy();
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][1].method).toBeUndefined();

    fireEvent.click(screen.getByRole('button', {name: 'Approve code repair'}));
    expect(await screen.findByText(/Repair repair-1 was accepted/)).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole('button', {name: 'Approve code repair'})).toBeNull());
    expect(JSON.parse(request.mock.calls[1][1].body)).toEqual({action: 'approve-workflow-repair', actionId: pending.id});
    expect(screen.getByText('Repair status: queued')).toBeTruthy();
    expect(screen.queryByText('Code verification passed. Confirm the affected workflow by retrying it.')).toBeNull();
  });

  it('keeps a rejected approval visible without showing a successful queue receipt', async () => {
    request.mockResolvedValueOnce(Response.json({workflowRepairs: [pending]}))
      .mockResolvedValueOnce(Response.json({error: 'Administrator approval is required.'}, {status: 403}));
    render(createElement(WorkflowRepairReview));
    fireEvent.click(await screen.findByRole('button', {name: 'Approve code repair'}));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Administrator approval is required.');
    expect(screen.queryByText(/was accepted/)).toBeNull();
    expect(screen.getByText('Document upload failed')).toBeTruthy();
  });

  it('does not describe blocked repairs as completed or silently retry them', async () => {
    request.mockResolvedValueOnce(Response.json({workflowRepairs: [{...pending,
      approval_status: 'approved', status: 'failed', error_message: 'REPAIR_POLICY_BLOCKED',
      result: {repairId: 'repair-1', status: 'blocked', verified: false},
    }]}));
    render(createElement(WorkflowRepairReview));
    expect(await screen.findByText('Repair status: blocked')).toBeTruthy();
    expect(screen.getByText('Administrator attention required: REPAIR_POLICY_BLOCKED')).toBeTruthy();
    expect(screen.queryByRole('button', {name: /Approve|Retry queueing/})).toBeNull();
    expect(request).toHaveBeenCalledTimes(1);
  });
});

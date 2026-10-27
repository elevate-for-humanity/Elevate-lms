import {describe, expect, it, vi} from 'vitest';
import {reportPortalWorkflowIssue} from '@/lib/paris/portal-support';

const issue = {workflow: 'document_upload', message: 'Upload failed.', status: 500, page: '/learner/documents'};

describe('portal workflow incident acknowledgement', () => {
  it('acknowledges only a successful response containing the durable incident ID', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ok: true, incidentId: 'incident-1'}, {status: 201}));
    expect(await reportPortalWorkflowIssue(issue, fetcher)).toEqual({status: 'reported', httpStatus: 201, incidentId: 'incident-1'});
    expect(fetcher.mock.calls[0][1]).toMatchObject({credentials: 'same-origin', body: JSON.stringify(issue)});
  });

  it.each([401, 403, 500, 503])('preserves HTTP %s failure without claiming it was reported', async status => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({error: 'unavailable'}, {status}));
    expect(await reportPortalWorkflowIssue(issue, fetcher)).toEqual({status: 'failed', httpStatus: status});
  });

  it('rejects an unconfirmed success that has no receipt', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ok: true}));
    expect(await reportPortalWorkflowIssue(issue, fetcher)).toEqual({status: 'failed', httpStatus: 200});
  });

  it('keeps a network failure retryable without losing the original issue', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new Error('network failure'))
      .mockResolvedValueOnce(Response.json({ok: true, incidentId: 'incident-1'}));
    expect(await reportPortalWorkflowIssue(issue, fetcher)).toEqual({status: 'failed'});
    expect(await reportPortalWorkflowIssue(issue, fetcher)).toMatchObject({status: 'reported', incidentId: 'incident-1'});
    expect(fetcher.mock.calls[0][1].body).toEqual(fetcher.mock.calls[1][1].body);
  });
});

import { GrantsApp } from '@/apps/marketing/app/apps/grants/GrantsApp';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  SamWorkspaceActions,
  GrantsSearchActions,
  GrantRecordActions,
  GrantApplicationActions,
} from '@/components/apps/WorkspaceActions';
const refresh = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
const entityId = '22222222-2222-4222-8222-222222222222';
let fetcher: ReturnType<typeof vi.fn>;
beforeEach(() => {
  refresh.mockReset();
  fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  vi.stubGlobal('fetch', fetcher);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe('Individual app forms execute their connected workflows', () => {
  it('saves an entity record from the actual form', async () => {
    render(<SamWorkspaceActions entities={[]} documents={[]} alerts={[]} />);
    fireEvent.change(screen.getByLabelText('Legal business name'), {
      target: { value: 'Fixture business' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save entity record' }));
    await screen.findByText('Entity record saved.');
    expect(fetcher.mock.calls[0][0]).toBe('/api/apps/sam-gov/workspace');
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toMatchObject({
      entity_id: null,
      legal_business_name: 'Fixture business',
      registration_status: 'draft',
    });
    expect(refresh).toHaveBeenCalled();
  });
  it('edits a selected record rather than adding another entity', async () => {
    render(
      <SamWorkspaceActions
        entities={[
          { id: entityId, legal_business_name: 'Existing fixture', registration_status: 'active' },
        ]}
        documents={[]}
        alerts={[]}
      />,
    );
    fireEvent.change(screen.getByLabelText('Record'), { target: { value: entityId } });
    expect(screen.getByLabelText('Legal business name')).toHaveValue('Existing fixture');
    fireEvent.click(screen.getByRole('button', { name: 'Save entity record' }));
    await screen.findByText('Entity record saved.');
    expect(JSON.parse(fetcher.mock.calls[0][1].body).entity_id).toBe(entityId);
  });
  it('shows a plan-limit failure without reporting successful delivery', async () => {
    fetcher.mockResolvedValue({ ok: false, json: async () => ({ error: 'Entity limit reached' }) });
    render(<SamWorkspaceActions entities={[]} documents={[]} alerts={[]} />);
    fireEvent.change(screen.getByLabelText('Legal business name'), {
      target: { value: 'Fixture business' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save entity record' }));
    await screen.findByText('Entity limit reached');
    expect(screen.queryByText('Entity record saved.')).not.toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
  it('runs a live-provider search action and replaces the displayed results', async () => {
    const onResults = vi.fn();
    const rows = [{ id: entityId, title: 'Fixture search result' }];
    fetcher.mockResolvedValue({
      ok: true,
      json: async () => ({ total: 1, remaining: 49, opportunities: rows }),
    });
    render(<GrantsSearchActions onResults={onResults} />);
    fireEvent.change(screen.getByLabelText('Funding keywords'), { target: { value: 'workforce' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search Grants.gov' }));
    await screen.findByText('1 matching opportunities. 49 searches remain this month.');
    expect(onResults).toHaveBeenCalledWith(rows);
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({
      action: 'search',
      keyword: 'workforce',
    });
  });
  it('removes saved grants through the owned record action', async () => {
    render(<GrantRecordActions grantId={entityId} saved />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove saved grant' }));
    await screen.findByText('Grant removed from saved items.');
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({
      action: 'unsave',
      grant_id: entityId,
    });
  });
  it('updates the application tracker with the supported database status', async () => {
    render(<GrantApplicationActions application={{ id: entityId, status: 'draft' }} />);
    fireEvent.click(screen.getByText('Update tracker'));
    fireEvent.change(screen.getByLabelText('Application status'), {
      target: { value: 'approved' },
    });
    fireEvent.change(screen.getByLabelText('Notes'), {
      target: { value: 'Fixture tracking note' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save tracker' }));
    await screen.findByText('Tracker saved.');
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toMatchObject({
      action: 'application',
      id: entityId,
      status: 'approved',
      notes: 'Fixture tracking note',
    });
  });
  it('keeps date-only funding deadlines on their source calendar day in western time zones', () => {
    vi.stubEnv('TZ', 'America/Los_Angeles');
    render(
      <GrantsApp
        user={{ id: 'buyer' }}
        subscription={{ plan: 'professional', status: 'active' }}
        opportunities={[{ id: entityId, title: 'Fixture funding', deadline: '2099-01-01' }]}
        savedGrants={[]}
        applications={[]}
        trialDaysRemaining={0}
      />,
    );
    const expected = new Date('2099-01-01').toLocaleDateString(undefined, { timeZone: 'UTC' });
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});

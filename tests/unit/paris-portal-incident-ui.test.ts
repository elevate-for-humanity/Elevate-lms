// @vitest-environment jsdom
import {createElement} from 'react';
import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {PARIS_PORTAL_ISSUE_EVENT, type PortalSupportIssue} from '@/lib/paris/portal-support';

vi.mock('next/navigation', () => ({usePathname: () => '/program-holder/dashboard'}));
// Exercise the reporting surface without loading the unrelated chat/voice stack.
vi.mock('react', async importOriginal => {
  const react = await importOriginal<typeof import('react')>();
  return {...react, lazy: () => ({portalIssue}: {portalIssue?: PortalSupportIssue}) =>
    react.createElement('p', null, portalIssue?.message ?? 'Chat ready')};
});
import {ParisFloatingButton} from '@/components/paris/ParisFloatingButton';

const issue = {workflow: 'document_upload', message: 'I could not upload the onboarding document.', status: 500};
let request: ReturnType<typeof vi.fn>;
beforeEach(() => {request = vi.fn(); vi.stubGlobal('fetch', request);});
afterEach(() => {cleanup(); vi.unstubAllGlobals();});

describe('portal issue reporting feedback', () => {
  it('retains the original message after a failed report and acknowledges only a real retry receipt', async () => {
    request.mockResolvedValueOnce(Response.json({error: 'Unavailable'}, {status: 503}))
      .mockResolvedValueOnce(Response.json({ok: true, incidentId: 'incident-retry'}, {status: 201}));
    render(createElement(ParisFloatingButton, {surface: 'portal'}));
    act(() => {window.dispatchEvent(new CustomEvent(PARIS_PORTAL_ISSUE_EVENT, {detail: issue}));});
    expect(await screen.findByText('This issue could not be reported. Your message is still here.')).toBeTruthy();
    expect(await screen.findByText(issue.message)).toBeTruthy();
    expect(screen.queryByText(/Issue reported for diagnostic review/)).toBeNull();

    fireEvent.click(screen.getByRole('button', {name: 'Retry report'}));
    expect(await screen.findByText(/Issue reported for diagnostic review. Reference: incident-retry/)).toBeTruthy();
    expect(screen.queryByRole('button', {name: 'Retry report'})).toBeNull();
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls.map(call => JSON.parse(call[1].body))).toEqual([issue, issue]);
    expect(screen.getByText(issue.message)).toBeTruthy();
  });

  it('prevents a stale report response from replacing the newer issue status', async () => {
    let finishFirst!: (response: Response) => void;
    request.mockImplementationOnce(() => new Promise<Response>(resolve => {finishFirst = resolve;}))
      .mockResolvedValueOnce(Response.json({error: 'Sign in required'}, {status: 401}));
    render(createElement(ParisFloatingButton, {surface: 'portal'}));
    act(() => {window.dispatchEvent(new CustomEvent(PARIS_PORTAL_ISSUE_EVENT, {detail: issue}));});
    const latestIssue = {...issue, message: 'The second document also failed.'};
    act(() => {window.dispatchEvent(new CustomEvent(PARIS_PORTAL_ISSUE_EVENT, {detail: latestIssue}));});
    expect(await screen.findByText('Sign in again to report this issue. Your message is still here.')).toBeTruthy();
    await act(async () => {finishFirst(Response.json({ok: true, incidentId: 'stale-incident'}, {status: 201}));});
    await waitFor(() => expect(screen.queryByText(/stale-incident/)).toBeNull());
    expect(screen.getByText('Sign in again to report this issue. Your message is still here.')).toBeTruthy();
    expect(await screen.findByText(latestIssue.message)).toBeTruthy();
  });
});

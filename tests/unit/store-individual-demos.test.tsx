import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import IndividualAppDemo from '@/components/store/IndividualAppDemo';
import { INDIVIDUAL_APP_CATALOG } from '@/lib/apps/individual-app-plans';
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('@/components/voice/useNaturalVoice', () => ({
  useNaturalVoice: () => ({ play: vi.fn(), stop: vi.fn(), error: null }),
}));
vi.mock('@/components/store/WebsiteBuilderCommercial', () => ({
  default: () => <div>Website builder workspace</div>,
}));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe('Plan-specific Store demos use the subscriber controls without production writes', () => {
  it('saves local entity records, updates the workspace and enforces the Starter limit', async () => {
    const network = vi.fn();
    vi.stubGlobal('fetch', network);
    render(<IndividualAppDemo catalog={INDIVIDUAL_APP_CATALOG['sam-gov']} />);
    fireEvent.change(screen.getByLabelText('Legal business name'), {
      target: { value: 'Demo training business' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save entity record' }));
    await screen.findAllByRole('option', { name: 'Demo training business' });
    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toBe('Entity record saved.');
      expect((screen.getByRole('button', { name: 'Save entity record' }) as HTMLButtonElement).disabled).toBe(false);
    });
    expect(network).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Legal business name'), {
      target: { value: 'Second example' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save entity record' }));
    await screen.findByText('This plan allows 1 entity records.');
    expect(screen.queryByRole('option', { name: 'Second example' })).toBeNull();
  });
  it('switches plan features and prices together', () => {
    render(<IndividualAppDemo catalog={INDIVIDUAL_APP_CATALOG['sam-gov']} />);
    fireEvent.click(screen.getByRole('button', { name: 'Professional · $149/mo' }));
    expect(screen.getByRole('heading', { name: 'Professional includes' })).toBeTruthy();
    expect(screen.getByText('✓ Up to 5 entity records')).toBeTruthy();
    expect(screen.queryByText('✓ 1 entity')).toBeNull();
  });
  it('uses official snapshot records for grant saving and plan-gated application tracking', async () => {
    const network = vi.fn();
    vi.stubGlobal('fetch', network);
    const records = [
      {
        id: 'real-public-id',
        title: 'Public workforce opportunity',
        opportunity_url: 'https://www.grants.gov/search-results-detail/1',
        deadline: '2027-01-01',
      },
    ];
    render(<IndividualAppDemo catalog={INDIVIDUAL_APP_CATALOG.grants} opportunities={records} />);
    expect(screen.queryByRole('button', { name: 'Track application' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Professional · $199/mo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save grant' }));
    await screen.findAllByRole('button', { name: 'Remove saved grant' });
    fireEvent.click(screen.getByRole('button', { name: 'Track application' }));
    await screen.findByText('Update tracker');
    expect(network).not.toHaveBeenCalled();
    expect(screen.getByText('✓ 500 grant searches/mo')).toBeTruthy();
  });
  it('reports unavailable federal data instead of inventing grants', () => {
    render(<IndividualAppDemo catalog={INDIVIDUAL_APP_CATALOG.grants} />);
    expect(screen.getByText(/The Grants.gov snapshot is unavailable/)).toBeTruthy();
    expect(screen.getByText(/No current opportunities to show/)).toBeTruthy();
  });
});

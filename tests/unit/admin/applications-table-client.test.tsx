import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ApplicationsTableClient, {
  type ApplicationRow,
} from '@/apps/admin/app/admin/applications/ApplicationsTableClient';

describe('ApplicationsTableClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('Approve button uses canonical approve endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    vi.stubGlobal('fetch', fetchMock);

    const row: ApplicationRow = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      first_name: 'Jane',
      last_name: 'Doe',
      full_name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '555-555-5555',
      city: 'Indianapolis',
      zip: '46201',
      program_interest: 'HVAC',
      program_id: '7b5a2e73-45cc-4ca2-beb7-3b2a35d4ec1a',
      support_notes: null,
      status: 'submitted',
      source: 'website',
      type: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    render(<ApplicationsTableClient applications={[row]} />);

    fireEvent.click(screen.getByRole('button', { name: /approve/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [url, options] = fetchMock.mock.calls[0] as [
      string,
      { method?: string; body?: string },
    ];

    expect(url).toBe(`/api/admin/applications/${row.id}/approve`);
    expect(options.method).toBe('POST');
    expect(options.body).toBe('{}');
  });
});

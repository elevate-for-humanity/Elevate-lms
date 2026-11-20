import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SupportForm } from '@/apps/lms/app/lms/(app)/support/SupportForm';
const request = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', request);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function submit() {
  render(<SupportForm />);
  fireEvent.change(screen.getByPlaceholderText('Brief description of your issue'), {
    target: { value: 'Cannot clock in' },
  });
  fireEvent.change(
    screen.getByPlaceholderText('Please provide details about your inquiry or issue...'),
    { target: { value: 'Clock-in fails at my assigned shop.' } },
  );
  fireEvent.click(screen.getByRole('button', { name: 'Send Message' }));
}
describe('support report confirmation', () => {
  it('shows delivery errors and retains the report for a successful retry', async () => {
    request
      .mockResolvedValueOnce(
        Response.json({ error: 'Support message could not be delivered' }, { status: 502 }),
      )
      .mockResolvedValueOnce(Response.json({ success: true }));
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Support message could not be delivered',
    );
    expect(screen.getByPlaceholderText('Brief description of your issue')).toHaveValue(
      'Cannot clock in',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Send Message' }));
    expect(await screen.findByText('Message Sent!')).toBeTruthy();
    expect(JSON.parse(request.mock.calls[1][1].body).message).toBe(
      'Clock-in fails at my assigned shop.',
    );
  });
  it('requires an explicit success receipt, not an HTTP 200 HTML login response', async () => {
    request.mockResolvedValueOnce(new Response('<html>Sign in</html>'));
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('could not confirm your report');
    expect(screen.queryByText('Message Sent!')).toBeNull();
  });
  it('explains an expired session and preserves the report', async () => {
    request.mockResolvedValueOnce(Response.json({ error: 'Unauthorized' }, { status: 401 }));
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Your session expired');
  });
  it('recovers from network failure without discarding the report', async () => {
    request.mockRejectedValueOnce(new Error('Network unavailable'));
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Network unavailable');
    expect(screen.getByRole('button', { name: 'Send Message' })).toBeEnabled();
  });
});

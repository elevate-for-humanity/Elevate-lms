import { beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
import EmployerApplicationForm from '@/apps/marketing/app/apply/employer/EmployerApplicationForm';
const key = 'elevate-employer-application-draft-v1';
beforeEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.restoreAllMocks();
});
it('restores business details but requires certification again', async () => {
  sessionStorage.setItem(
    key,
    JSON.stringify({
      companyName: 'Fixture Home Care',
      contactName: 'Fixture',
      email: 'contact@fixture.test',
      consent: true,
      unexpected: 'ignored',
    }),
  );
  render(<EmployerApplicationForm />);
  await waitFor(() =>
    expect(screen.getByLabelText('Company / Organization Name *')).toHaveValue('Fixture Home Care'),
  );
  expect(screen.getByRole('checkbox')).not.toBeChecked();
  expect(screen.getByRole('status')).toHaveTextContent('unfinished application was restored');
});
it('retains edited entries after a submission failure', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
  render(<EmployerApplicationForm />);
  fireEvent.change(screen.getByLabelText('Company / Organization Name *'), {
    target: { value: 'Fixture Home Care' },
  });
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.submit(
    screen.getByRole('button', { name: 'Submit Employer Application' }).closest('form')!,
  );
  await screen.findByText(/Network error/);
  expect(JSON.parse(sessionStorage.getItem(key)!).companyName).toBe('Fixture Home Care');
});
it('still permits entry when browser storage is unavailable', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  render(<EmployerApplicationForm />);
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Submit Employer Application' })).toBeEnabled(),
  );
  expect(screen.getByRole('status')).toHaveTextContent(/unavailable/);
});

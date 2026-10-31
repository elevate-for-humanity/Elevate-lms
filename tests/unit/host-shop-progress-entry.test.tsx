import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import PracticalProgressEntry from '@/components/host-shop/PracticalProgressEntry';
const params = vi.hoisted(() => ({ studentId: '' }));
vi.mock('@/hooks/useSafeSearchParams', () => ({
  useSafeSearchParams: () => ({ get: () => params.studentId || null }),
}));
const apprentice = {
  enrollmentId: 'enrollment',
  studentId: 'student',
  name: 'Assigned learner',
  standard: { occupationTitle: 'Barber' },
};
const practice = { items: [], recordedCount: 0, requiredCount: 0, percent: 100, complete: true };
const response = (body: any, ok = true) => ({ ok, json: async () => body });
beforeEach(() => {
  params.studentId = '';
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it('loads the only assigned apprentice, saves observed work, and displays the persisted progress', async () => {
  const entries: any[] = [];
  const request = vi.fn(async (url: string, options?: RequestInit) => {
    if (url === '/api/host-shop/competencies') return response({ apprentices: [apprentice] });
    if (options?.method === 'POST') {
      const body = JSON.parse(String(options.body));
      entries.push({
        id: 'saved',
        service_name: body.serviceName,
        performed_on: body.performedOn,
        subject_type: body.subjectType,
        mentor_notes: body.notes,
      });
      return response({ ok: true, id: 'saved' });
    }
    return response({ entries: [...entries], canRecord: true, practice });
  });
  vi.stubGlobal('fetch', request);
  render(<PracticalProgressEntry />);
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: 'Select apprentice' })).toHaveValue('enrollment'),
  );
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: 'Service', exact: true })).toBeEnabled(),
  );
  fireEvent.change(screen.getByRole('combobox', { name: 'Service', exact: true }), {
    target: { value: 'Fade' },
  });
  fireEvent.change(screen.getByRole('textbox', { name: 'Training notes' }), {
    target: { value: 'Practice the blend transition next.' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save student progress' }));
  await screen.findByText('Practical service saved. Student progress is updated.');
  expect(screen.getByRole('region', { name: 'Saved student progress' })).toHaveTextContent(
    'Practice the blend transition next.',
  );
  const sent = request.mock.calls.find(([, options]) => options?.method === 'POST');
  expect(JSON.parse(String(sent?.[1]?.body))).toMatchObject({
    enrollmentId: 'enrollment',
    serviceName: 'Fade',
    subjectType: 'patron',
    notes: 'Practice the blend transition next.',
  });
});
it('lets an administrator inspect the entry fields while keeping preview writes disabled', async () => {
  const request = vi.fn(async (url: string) =>
    response(
      url === '/api/host-shop/competencies'
        ? { apprentices: [apprentice] }
        : { entries: [], canRecord: false, practice },
    ),
  );
  vi.stubGlobal('fetch', request);
  render(<PracticalProgressEntry />);
  expect(await screen.findByRole('combobox', { name: 'Service', exact: true })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Save student progress' })).toBeDisabled();
  expect(screen.getByText(/Read-only preview or staff access/)).toBeInTheDocument();
  expect(request.mock.calls.every((call) => call.length === 1 || call[1]?.method !== 'POST')).toBe(
    true,
  );
});
it('surfaces a forbidden roster response instead of showing an empty apprentice dropdown as success', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => response({ error: 'Shop assignment needs attention' }, false)),
  );
  render(<PracticalProgressEntry />);
  expect(await screen.findByText('Shop assignment needs attention')).toBeInTheDocument();
  expect(
    screen.queryByText('No active apprentices are assigned to this shop.'),
  ).not.toBeInTheDocument();
});
it('opens the apprentice selected from the shop roster rather than the first student', async () => {
  params.studentId = 'student-2';
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      response(
        url === '/api/host-shop/competencies'
          ? {
              apprentices: [
                apprentice,
                {
                  ...apprentice,
                  studentId: 'student-2',
                  enrollmentId: 'enrollment-2',
                  name: 'Second learner',
                },
              ],
            }
          : { entries: [], canRecord: true, practice },
      ),
    ),
  );
  render(<PracticalProgressEntry />);
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: 'Select apprentice' })).toHaveValue('enrollment-2'),
  );
});

it('ignores a late progress response after another apprentice has been selected', async () => {
  let finishFirst: (value: any) => void = () => {};
  const first = new Promise((resolve) => {
    finishFirst = resolve;
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url === '/api/host-shop/competencies')
        return response({
          apprentices: [
            apprentice,
            { ...apprentice, enrollmentId: 'second', name: 'Second learner' },
          ],
        });
      if (url.includes('enrollmentId=enrollment')) return first;
      return response({ entries: [], canRecord: false, practice });
    }),
  );
  render(<PracticalProgressEntry />);
  await screen.findByRole('option', { name: 'Second learner — Barber' });
  fireEvent.change(screen.getByRole('combobox', { name: 'Select apprentice' }), {
    target: { value: 'enrollment' },
  });
  fireEvent.change(screen.getByRole('combobox', { name: 'Select apprentice' }), {
    target: { value: 'second' },
  });
  await screen.findByText(/Read-only preview or staff access/);
  await act(async () => {
    finishFirst(response({ entries: [], canRecord: true, practice }));
    await first;
  });
  expect(screen.getByRole('combobox', { name: 'Select apprentice' })).toHaveValue('second');
  expect(screen.getByRole('button', { name: 'Save student progress' })).toBeDisabled();
});

it('counts an older lowercase service under its displayed checklist label', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      response(
        url === '/api/host-shop/competencies'
          ? { apprentices: [{ ...apprentice, standard: { occupationTitle: 'Hair Stylist' } }] }
          : {
              entries: [
                {
                  id: 'old-entry',
                  service_name: ' updo ',
                  performed_on: '2026-01-01',
                  subject_type: 'mannequin',
                },
              ],
              canRecord: false,
              practice,
            },
      ),
    ),
  );
  render(<PracticalProgressEntry />);
  expect(await screen.findByRole('row', { name: 'Updo 1 Owner checkoff' })).toBeInTheDocument();
});

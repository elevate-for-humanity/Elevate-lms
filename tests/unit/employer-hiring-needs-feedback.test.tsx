import { renderToString } from 'react-dom/server';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const save = vi.hoisted(() => vi.fn());
vi.mock('@/apps/lms/app/employer/hiring-needs/actions', () => ({ saveHiringNeeds: save }));

import { HiringNeedsForm, type HiringNeedsFields } from '@/apps/lms/app/employer/hiring-needs/HiringNeedsForm';

const initial: HiringNeedsFields = {
  roles: 'Saved training needs', locations: 'Saved worksite', timeline: '', additionalInfo: '',
};
const confirmation = 'Your hiring and training needs are saved.';

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

it('does not claim an unsaved edit is already saved, then confirms the refreshed persisted values', async () => {
  let finish!: () => void;
  save.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
  const { rerender } = render(<HiringNeedsForm initial={initial} saved />);
  expect(screen.getByRole('status')).toHaveTextContent(confirmation);

  const roles = screen.getByLabelText('Positions or staff training needed');
  fireEvent.change(roles, { target: { value: 'Updated training needs' } });
  expect(screen.queryByText(confirmation)).not.toBeInTheDocument();

  fireEvent.submit(roles.closest('form')!);
  await waitFor(() => expect(screen.getByRole('button')).toBeDisabled());
  expect(screen.getByRole('button')).toHaveTextContent('Saving hiring and training needs');
  expect(screen.queryByText(confirmation)).not.toBeInTheDocument();
  expect(save.mock.calls[0][0].get('roles')).toBe('Updated training needs');

  await act(async () => { finish(); });
  expect(screen.getByRole('button')).toBeEnabled();
  // A finished request alone is not evidence that the old server props were saved.
  expect(screen.queryByText(confirmation)).not.toBeInTheDocument();
  rerender(<HiringNeedsForm initial={{ ...initial, roles: 'Updated training needs' }} saved />);
  expect(screen.getByRole('status')).toHaveTextContent(confirmation);
  expect(roles).toHaveValue('Updated training needs');
});

it('hides an earlier confirmation while submitting even when the values did not change', async () => {
  let finish!: () => void;
  save.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
  render(<HiringNeedsForm initial={initial} saved />);
  fireEvent.submit(screen.getByRole('button').closest('form')!);
  await waitFor(() => expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true'));
  expect(screen.queryByText(confirmation)).not.toBeInTheDocument();
  await act(async () => { finish(); });
  expect(screen.getByRole('status')).toHaveTextContent(confirmation);
});

it('does not infer save success for an ordinary initial visit', () => {
  render(<HiringNeedsForm initial={initial} />);
  expect(screen.queryByText(confirmation)).not.toBeInTheDocument();
  expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
});

it('does not expose editable controls until controlled input handlers are hydrated', () => {
  const html = renderToString(<HiringNeedsForm initial={initial} />);
  const shell = document.createElement('div');
  shell.innerHTML = html;
  for (const control of shell.querySelectorAll('textarea,button')) {
    expect(control).toBeDisabled();
  }
  render(<HiringNeedsForm initial={initial} />);
  expect(screen.getByLabelText('Positions or staff training needed')).toBeEnabled();
  expect(screen.getByRole('button')).toBeEnabled();
});

it('replaces persisted values repeatedly without appending previous state', () => {
  render(<HiringNeedsForm initial={initial} />);
  const field = screen.getByLabelText('Positions or staff training needed');
  for (const value of ['QA staff training only','QA updated staff training','']) {
    fireEvent.change(field,{target:{value}});
    expect(field).toHaveValue(value);
  }
});

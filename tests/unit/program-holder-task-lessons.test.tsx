import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { existsSync, readFileSync } from 'node:fs';
import { holderTaskLessons, getHolderTaskLesson } from '@/lib/program-holder/task-lessons';
import { getFlatNavItems } from '@/lib/navigation/navigation-config';
const mock = vi.hoisted(() => ({
  pathname: '/program-holder/hours',
  play: vi.fn(),
  stop: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
}));
vi.mock('next/navigation', () => ({ usePathname: () => mock.pathname }));
vi.mock('@/components/voice/useNaturalVoice', () => ({
  useNaturalVoice: () => ({ ...mock, isPaused: false, isLoading: false, error: null }),
}));
import { ProgramHolderTaskGuide } from '@/components/program-holder/ProgramHolderTaskGuide';
beforeEach(() => {
  mock.pathname = '/program-holder/hours';
  mock.play.mockReset().mockResolvedValue(true);
  mock.stop.mockReset();
});
afterEach(cleanup);
it('opens only the selected tab lesson, advances after narration ends, and stops on navigation', async () => {
  const view = render(<ProgramHolderTaskGuide />);
  expect(
    screen.getByText('Record actual training or review a submitted hour entry.'),
  ).toBeInTheDocument();
  expect(screen.queryByText('PARIS guides you · Step 1 of 3')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Watch PARIS show me' }));
  await waitFor(() => expect(mock.play).toHaveBeenCalledTimes(1));
  expect(mock.play.mock.calls[0][0]).toContain('Select the assigned student and program');
  act(() => mock.play.mock.calls[0][1].onEnded());
  await waitFor(() =>
    expect(screen.getByText('PARIS guides you · Step 2 of 3')).toBeInTheDocument(),
  );
  expect(mock.play.mock.calls.at(-1)?.[0]).toContain('actual dates, hours');
  mock.pathname = '/program-holder/documents';
  view.rerender(<ProgramHolderTaskGuide />);
  expect(screen.getByText('Submit or correct a requested document.')).toBeInTheDocument();
  expect(screen.queryByText('PARIS guides you · Step 2 of 3')).not.toBeInTheDocument();
  expect(mock.stop).toHaveBeenCalled();
});
it('keeps Home and live meeting rooms free of the training panel', () => {
  expect(getHolderTaskLesson('/program-holder/dashboard')).toBeUndefined();
  expect(getHolderTaskLesson('/program-holder/meetings/room-id')).toBeUndefined();
  expect(getHolderTaskLesson('/program-holder/students/pending')?.title).toBe('Applicants');
});
it('uses real published images and unique canonical navigation destinations', () => {
  for (const lesson of holderTaskLessons) {
    expect(existsSync(`public/images/pages/${lesson.image}`), lesson.image).toBe(true);
    for (const image of lesson.scenes || [])
      expect(existsSync(`public/images/pages/${image}`), image).toBe(true);
  }
  const hrefs = getFlatNavItems('site_coordinator').map((item) => item.href);
  expect(new Set(hrefs).size).toBe(hrefs.length);
  for (const route of ['meetings', 'phone', 'email', 'students', 'hours'])
    expect(hrefs).toContain(`/program-holder/${route}`);
});
it('renders one shell in the parent and retains section approval gates', () => {
  const parent = readFileSync('apps/lms/app/program-holder/layout.tsx', 'utf8');
  expect(parent.match(/<PlatformShell\b/g)).toHaveLength(1);
  expect(parent).not.toContain('PORTAL_LINKS');
  for (const file of [
    'apps/lms/app/program-holder/dashboard/layout.tsx',
    'components/program-holder/ProgramHolderSectionLayout.tsx',
  ]) {
    const source = readFileSync(file, 'utf8');
    expect(source).not.toContain('<PlatformShell');
    expect(source).toContain('await requireProgramHolder()');
  }
});

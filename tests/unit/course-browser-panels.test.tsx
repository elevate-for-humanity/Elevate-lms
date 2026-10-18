import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import UnifiedCourseBuilder from '@/components/admin/course-builder/UnifiedCourseBuilder';
import CourseProductionWorkspace from '@/components/admin/course-builder/CourseProductionWorkspace';
import { CourseStudioApplication } from '@/components/studio/CourseStudioApplication';

vi.mock('next/dynamic', () => ({
  default: () => () => <iframe title="Cloud browser session" src="about:blank" />,
}));
vi.mock('@/components/admin/course-builder/CredentialRegistryPanel', () => ({
  default: () => null,
}));
vi.mock('@/components/studio/CourseProvider', () => ({
  useCourse: () => ({
    state: {
      course: { id: 'course', title: 'Course', status: 'draft' },
      publishState: { isPublished: false },
      autosave: { isDirty: true, lastSavedAt: null },
      warnings: [],
      lessons: [],
    },
    save: vi.fn(),
    setPanel: vi.fn(),
  }),
}));
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ courses: [], programs: [] }) })),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('opens the Unified Course Builder browser only on request and preserves it when hidden', async () => {
  render(<UnifiedCourseBuilder />);
  await waitFor(() => expect(fetch).toHaveBeenCalled());
  expect(screen.queryByTitle('Cloud browser session')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Open Course browser' }));
  const frame = screen.getByTitle('Cloud browser session');
  fireEvent.click(screen.getByRole('button', { name: 'Close Course browser' }));
  fireEvent.click(screen.getByRole('button', { name: 'Open Course browser' }));
  expect(screen.getByTitle('Cloud browser session')).toBe(frame);
  expect(screen.getByRole('separator', { name: 'Resize Course browser' })).toBeInTheDocument();
});

it('keeps the lesson editor, learner preview and browser mounted when changing side panels', async () => {
  render(
    <CourseStudioApplication>
      <label>
        Lesson draft
        <input defaultValue="Draft" />
      </label>
    </CourseStudioApplication>,
  );
  await waitFor(() => expect(fetch).toHaveBeenCalled());
  const learnerFrame = screen.getByTitle('Live learner course preview');
  const input = screen.getByRole('textbox', { name: 'Lesson draft' });
  fireEvent.change(input, { target: { value: 'Unsaved edits' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cloud Studio browser' }));
  const cloudFrame = screen.getByTitle('Cloud browser session');
  fireEvent.click(screen.getByRole('button', { name: 'Close Course side panel' }));
  fireEvent.click(screen.getByRole('button', { name: 'Open Course side panel' }));
  fireEvent.click(screen.getByRole('button', { name: 'Learner preview', exact: true }));
  expect(screen.getByTitle('Live learner course preview')).toBe(learnerFrame);
  expect(screen.getByTitle('Cloud browser session')).toBe(cloudFrame);
  expect(input).toHaveValue('Unsaved edits');
});

it('provides only one browser panel on the standalone Course Production route', async () => {
  render(<CourseProductionWorkspace initialCourseId="" initialTab="ultimate" />);
  await waitFor(() => expect(fetch).toHaveBeenCalled());
  expect(screen.getAllByRole('button', { name: /Open .*browser/i })).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Open Course browser' }));
  expect(screen.getAllByTitle('Cloud browser session')).toHaveLength(1);
  expect(screen.getAllByRole('separator')).toHaveLength(1);
});

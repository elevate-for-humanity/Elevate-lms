import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UltimateBuildPanel } from '@/components/admin/course-builder/UnifiedCourseBuilder';

vi.mock('@/components/studio/UnifiedEllieChat', () => ({ default: () => null }));
vi.mock('@/components/studio/DeployPanel', () => ({ default: () => null }));
vi.mock('@/components/admin/ParisSupervisionPanel', () => ({ default: () => null }));
vi.mock('@/components/admin/course-builder/CredentialRegistryPanel', () => ({ default: () => null }));
vi.mock('@/components/admin/course-builder/UltimateStageInspector', () => ({
  default: ({ operations }: { operations: React.ReactNode }) => <>{operations}</>,
}));

const course = {
  id: '832cf9d8-e676-4bfb-a623-ab13a7ddf847',
  title: 'Forklift and Manufacturing Operations',
  slug: 'forklift-and-manufacturing-operations',
  status: 'draft',
  duration_hours: 48,
};
const buildId = '53b6a9bd-6bd7-51c3-a6a5-6e25cdd893b3';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function setup(options: { preparationFails?: boolean; statusFails?: boolean } = {}) {
  let build: Record<string, unknown> | null = null;
  const writes: Array<{ url: string; body: Record<string, any> }> = [];
  const sources = new Map<string, string>();
  // Together these exceed one extraction's 250,000-character limit. Each complete part fits.
  const texts: Record<string, string> = {
    'Authorized_Lessons_Part_1.txt': 'Lessons 1–12. 120 minutes is total study time.\n' +
      'Complete authorized instruction.\n'.repeat(5000) + 'END OF LESSON 12',
    'Authorized_Lessons_Part_2.txt': 'Lessons 13–24, workbook activities and answer explanations.\n' +
      'Complete authorized instruction.\n'.repeat(5000) + 'END OF LESSON 24 AND SIMULATION SPECIFICATIONS',
  };
  const response = (body: unknown, ok = true) => ({ ok, json: async () => body });
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.startsWith('/api/admin/ultimate-course-builder?courseId=')) {
      return options.statusFails
        ? response({ error: 'Build status unavailable' }, false)
        : response({ builds: build ? [build] : [], acquisitions: [] });
    }
    if (url === '/api/admin/courses/generate/parse') {
      const file = (init?.body as FormData).get('file') as File;
      return response({ raw_text: texts[file.name], filename: file.name });
    }
    if (init?.method !== 'POST') throw new Error(`Unexpected request: ${url}`);
    const body = JSON.parse(String(init.body));
    writes.push({ url, body });
    if (url === '/api/admin/ultimate-course-builder' && body.action === 'create') {
      if (options.preparationFails) return response({ error: 'Preparation could not be saved' }, false);
      build = {
        id: buildId, course_id: course.id, status: 'initializing', current_step: 'standards_lock',
        owner_paused: true, ultimate_build_jobs: [],
      };
      return response({ ok: true, buildId, build, reused: false, queued: false, dispatched: false });
    }
    if (url === '/api/admin/ultimate-course-builder' && body.action === 'configure-contract') {
      if (!build || body.buildId !== build.id) throw new Error('A saved build is required');
      for (const source of body.instructionalSources) sources.set(source.id, source.text);
      return response({ ok: true, buildId });
    }
    if (url === '/api/admin/ultimate-course-builder/run')
      return response({ ok: true, buildId, queued: true, dispatched: true });
    throw new Error(`Unexpected production request: ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  render(<UltimateBuildPanel course={course} programSlug="forklift" />);
  fireEvent.click(screen.getByText('Upload syllabus for course production'));
  return { writes, sources, texts, fetchMock };
}

async function uploadAndReview(filename: string, text: string) {
  fireEvent.change(screen.getByLabelText('Syllabus document (10 MB maximum)'), {
    target: { files: [new File([text], filename, { type: 'text/plain' })] },
  });
  expect(await screen.findByLabelText(`Review extracted syllabus: ${filename}`)).toHaveValue(text);
  fireEvent.click(screen.getByRole('checkbox', {
    name: 'I reviewed this instructional source and authorize its use for this build.',
  }));
}

describe('existing-course source setup before production', () => {
  it('prepares an idle build, attaches complete source parts, and starts only on explicit Start', async () => {
    const { writes, sources, texts } = setup();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Prepare Ultimate build' })).toBeEnabled());
    const [first, second] = Object.entries(texts);
    await uploadAndReview(...first);
    expect(screen.getByRole('button', { name: 'Attach approved syllabus to Ultimate build' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Prepare Ultimate build' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Prepare Ultimate build' })).not.toBeInTheDocument());
    expect(writes).toEqual([{
      url: '/api/admin/ultimate-course-builder',
      body: { action: 'create', courseId: course.id, programSlug: 'forklift' },
    }]);
    expect(screen.getByLabelText(`Review extracted syllabus: ${first[0]}`)).toHaveValue(first[1]);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Attach approved syllabus to Ultimate build' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Attach approved syllabus to Ultimate build' }));
    await waitFor(() => expect(sources.get(`syllabus:${course.id}:${first[0]}`)).toBe(first[1]));

    await uploadAndReview(...second);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Attach approved syllabus to Ultimate build' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Attach approved syllabus to Ultimate build' }));
    await waitFor(() => expect(sources.size).toBe(2));
    expect([...sources.values()]).toEqual([first[1], second[1]]);
    expect([...sources.values()].join('').length).toBeGreaterThan(250_000);
    expect(writes.map(({ body }) => body.action)).toEqual(['create', 'configure-contract', 'configure-contract']);
    expect(writes.slice(1).every(({ body }) => body.buildId === buildId)).toBe(true);
    expect(screen.getByRole('button', { name: 'Publish course', exact: true })).toBeDisabled();

    await waitFor(() => expect(screen.getByRole('button', { name: 'Start Ultimate build' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Start Ultimate build' }));
    await waitFor(() => expect(writes.at(-1)).toEqual({
      url: '/api/admin/ultimate-course-builder/run', body: { buildId },
    }));
    expect(writes).toHaveLength(4);
    expect(writes.some(({ body }) => body.action === 'queue-course')).toBe(false);
  });

  it('saves an explicitly selected authoring model during preparation', async () => {
    const { writes } = setup();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Prepare Ultimate build' })).toBeEnabled());
    fireEvent.change(screen.getByPlaceholderText('Verified model ID'), { target: { value: 'gemini-selected-model' } });
    fireEvent.change(screen.getByLabelText('Google authoring location'), { target: { value: 'us-central1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Prepare Ultimate build' }));
    await waitFor(() => expect(writes).toHaveLength(1));
    expect(writes[0].body).toEqual({
      action: 'create', courseId: course.id, programSlug: 'forklift',
      instructionalAuthoring: { provider: 'google', model: 'gemini-selected-model', location: 'us-central1' },
    });
  });

  it('retains reviewed text when preparation fails and never falls back to starting production', async () => {
    const { writes, texts } = setup({ preparationFails: true });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Prepare Ultimate build' })).toBeEnabled());
    const [filename, text] = Object.entries(texts)[0];
    await uploadAndReview(filename, text);
    fireEvent.click(screen.getByRole('button', { name: 'Prepare Ultimate build' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Preparation could not be saved');
    expect(screen.getByLabelText(`Review extracted syllabus: ${filename}`)).toHaveValue(text);
    expect(screen.getByRole('button', { name: 'Attach approved syllabus to Ultimate build' })).toBeDisabled();
    expect(writes).toHaveLength(1);
    expect(writes[0].body.action).toBe('create');
  });

  it('requires verified course build status before preparing a new build', async () => {
    const { writes } = setup({ statusFails: true });
    expect(await screen.findByRole('alert')).toHaveTextContent('Build status unavailable');
    expect(screen.getByRole('button', { name: 'Prepare Ultimate build' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Prepare Ultimate build' }));
    expect(writes).toEqual([]);
  });
});

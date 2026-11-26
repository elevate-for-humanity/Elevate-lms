import { renderToStaticMarkup } from 'react-dom/server';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const mocks = vi.hoisted(() => ({
  loadProgram: vi.fn(),
  notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND'); }),
}));

vi.mock('@/lib/programs/load-program-page', () => ({
  loadProgramForPage: mocks.loadProgram,
}));
vi.mock('next/navigation', () => ({ notFound: mocks.notFound }));

// Preserve the framework's actual server-rendered image positioning and links
// when exporting this route for a bounded, local browser review.
vi.unmock('next/image');
vi.unmock('next/link');

import ForkliftProgramPage, { metadata } from '@/apps/marketing/app/programs/forklift/page';
import { FORKLIFT_MANUFACTURING_PROGRAM } from '@/data/programs/forklift';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.loadProgram.mockResolvedValue({
    program: FORKLIFT_MANUFACTURING_PROGRAM,
    synthesized: false,
  });
});

afterEach(cleanup);

describe('forklift marketing route', () => {
  it('renders the combined schedule and each module without promising a fixed practical finish', async () => {
    const tree = await ForkliftProgramPage();
    render(tree);
    expect(mocks.loadProgram).toHaveBeenCalledExactlyOnceWith('forklift');
    expect(screen.getByRole('heading', {
      level: 1,
      name: 'Forklift and Manufacturing Operations',
    })).toBeVisible();
    const schedule = screen.getByRole('region', { name: 'Program schedule' });
    expect(within(schedule).getByText('48 hours')).toBeVisible();
    expect(within(schedule).getByText('2–4 weeks')).toBeVisible();
    expect(within(schedule).getByText(/Training continues until job-specific competence is demonstrated/)).toBeVisible();
    expect(screen.getByText('8 hours · 4 lessons')).toBeVisible();
    expect(screen.getByText('16 hours · 8 lessons')).toBeVisible();
    expect(screen.getByText('24 hours · 12 lessons')).toBeVisible();
    expect(screen.getByText(/actual participation is recorded separately/)).toBeVisible();
    expect(metadata.alternates?.canonical).toBe('https://www.elevateforhumanity.org/programs/forklift');

    // Opt-in artifact generation keeps normal unit runs free of filesystem output.
    // The loader above remains mocked; this export performs no live lookup.
    const artifactDirectory = process.env.EFH_FORKLIFT_QA_DIR;
    if (artifactDirectory) {
      mkdirSync(artifactDirectory, { recursive: true });
      writeFileSync(join(artifactDirectory, 'forklift.html'),
        '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        + '<meta name="viewport" content="width=device-width,initial-scale=1">'
        + '<title>Forklift marketing route - local QA</title>'
        + '<link rel="stylesheet" href="/marketing.css"></head><body>'
        + renderToStaticMarkup(tree) + '</body></html>');
    }
  });

  it('shows the funding and equipment-authorization boundaries to prospective learners', async () => {
    render(await ForkliftProgramPage());
    expect(screen.getByText(/not currently listed as an approved Elevate ETPL\/WIOA program/)).toBeVisible();
    expect(screen.getByText(/funding must be confirmed for this exact program before enrollment/)).toBeVisible();
    expect(screen.getByText(/no external credential is awarded by finishing these online exercises/)).toBeVisible();
    expect(screen.getByText(/Only the employer can authorize independent operation/)).toBeVisible();
    expect(screen.getByText(/do not replace equipment demonstrations, supervised operation, workplace evaluation, or employer authorization/)).toBeVisible();
    expect(screen.queryByText(/guaranteed funding|free tuition|OSHA[- ]certified operator/i)).not.toBeInTheDocument();
  });

  it('publishes only the syllabus download and preserves program-specific inquiry links', async () => {
    const { container } = render(await ForkliftProgramPage());
    const syllabus = screen.getByRole('link', { name: '48-hour syllabus' });
    expect(syllabus).toHaveAttribute('href', '/docs/forklift-manufacturing/Program_Syllabus.pdf');
    const downloads = Array.from(container.querySelectorAll('a[href^="/docs/forklift-manufacturing/"]'));
    expect(downloads).toHaveLength(1);
    const file = join(process.cwd(), 'public/docs/forklift-manufacturing/Program_Syllabus.pdf');
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file).subarray(0, 5).toString()).toBe('%PDF-');
    expect(container.querySelector('a[href*="Employer_Practical_Guide.pdf"]')).toBeNull();
    expect(container.querySelector('a[href*="Workbook.pdf"]')).toBeNull();
    expect(screen.getByRole('link', { name: 'Request enrollment information' })).toHaveAttribute('href', '/apply?program=forklift');
    expect(screen.getByRole('link', { name: 'Discuss a hands-on partnership' })).toHaveAttribute('href', '/contact?program=forklift&interest=employer-training');
  });

  it('uses the not-found boundary when the published-program loader returns no record', async () => {
    mocks.loadProgram.mockResolvedValue(null);
    await expect(ForkliftProgramPage()).rejects.toThrow('NEXT_NOT_FOUND');
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });
});

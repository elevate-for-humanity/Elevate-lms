import { expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('@/components/program-holder/ProgramHolderWorkspaceView', () => ({ ProgramHolderWorkspaceView: (props: any) => <div data-section={props.section} data-query={props.studentQuery} data-status={props.studentStatus} /> }));
import Page from '@/apps/lms/app/program-holder/students/at-risk/page';
it('forwards follow-up search and status filters to the flagged roster', async () => {
  const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({ q: 'Learner', status: 'active' }) }));
  expect(html).toContain('data-section="at-risk"');
  expect(html).toContain('data-query="Learner"');
  expect(html).toContain('data-status="active"');
});
it('defaults to the unfiltered flagged roster', async () => {
  const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }));
  expect(html).toContain('data-query=""');
  expect(html).toContain('data-status="all"');
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildDefaultSiteConfig } from '@/lib/tenant/default-site-config';
const state = vi.hoisted(() => ({ allowed: true, signedIn: true, filters: {} as Record<string,string>, reads: [] as string[], revisionSite: 'site-a' }));
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('404'); }, redirect: (url: string) => { throw new Error('redirect ' + url); } }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.signedIn ? { id: 'owner' } : null } }) } }) }));
vi.mock('@/lib/apps/website-builder-access', () => ({ getWebsiteBuilderAccess: async () => ({ allowed: true }) }));
vi.mock('@/lib/websites/can-manage-hosted-website', () => ({ canManageHostedWebsite: async () => state.allowed }));
vi.mock('@/lib/tenant/published-offerings', () => ({ loadPublishedOfferings: async (config: unknown) => config }));
vi.mock('../../apps/marketing/app/apps/website-builder/edit/[websiteId]/preview/ResponsivePreviewClient', () => ({ ResponsivePreviewClient: () => null }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: (table: string) => {
 state.reads.push(table); state.filters = {};
 const query = { select: () => query, eq: (key: string, value: string) => { state.filters[key] = value; return query; }, maybeSingle: async () => ({ error: null, data: table === 'user_websites' ? { id: 'site-a', site_name: 'Current', site_config: buildDefaultSiteConfig({ organizationName: 'Current' }) } : table === 'website_revisions' ? (state.filters.website_id === state.revisionSite ? { site_name: 'Candidate', site_config: buildDefaultSiteConfig({ organizationName: 'Candidate' }) } : null) : { enabled: true } }) };
 return query;
} }) }));
import Preview from '../../apps/marketing/app/apps/website-builder/edit/[websiteId]/preview/page';
const revision = '11111111-1111-4111-8111-111111111111';
const props = (id?: string) => ({ params: Promise.resolve({ websiteId: 'site-a' }), searchParams: Promise.resolve({ revision: id }) });
beforeEach(() => { state.allowed = true; state.signedIn = true; state.reads = []; state.revisionSite = 'site-a'; });
describe('private saved-version preview', () => {
 it('loads a version of the authorized website without restoring it or enabling PARIS', async () => {
  const page = await Preview(props(revision));
  expect(page.props.siteName).toBe('Candidate');
  expect(page.props.config.branding.logoText).toBe('Candidate');
  expect(page.props.revisionId).toBe(revision);
  expect(page.props.parisEnabled).toBe(false);
 });
 it('does not read version content for a user without project access', async () => {
  state.allowed = false;
  await expect(Preview(props(revision))).rejects.toThrow('404');
  expect(state.reads).not.toContain('website_revisions');
 });
 it('rejects versions belonging to another website', async () => {
  state.revisionSite = 'site-b';
  await expect(Preview(props(revision))).rejects.toThrow('404');
 });
 it('rejects malformed IDs before looking up a version', async () => {
  await expect(Preview(props('invalid'))).rejects.toThrow('404');
  expect(state.reads).not.toContain('website_revisions');
 });
 it('preserves the current-preview path and enabled workspace', async () => {
  const page = await Preview(props(undefined));
  expect(page.props.siteName).toBe('Current');
  expect(page.props.parisEnabled).toBe(true);
 });
 it('requires sign-in before reading a project or version', async () => {
  state.signedIn = false;
  await expect(Preview(props(revision))).rejects.toThrow(`revision%3D${revision}`);
  expect(state.reads).toEqual([]);
 });
});

// @vitest-environment node
import {describe, expect, it, vi} from 'vitest';
import {NextRequest} from 'next/server';
import {STUDIO_WORKSPACES} from '@/lib/devstudio/workspace-registry';
vi.mock('@/lib/admin/guards', () => ({apiRequireAdmin: async () => ({user: {id: 'admin'}}), apiRequireRoles: vi.fn()}));
vi.mock('@/lib/api/withRateLimit', () => ({applyRateLimit: async () => null}));
vi.mock('@/lib/supabase/admin', () => ({requireAdminClient: async () => ({from: () => ({select: () => ({eq: () => ({maybeSingle: async () => ({data: {value: JSON.stringify([
  {label: 'Home', href: '/admin/dashboard', items: [{label: 'Dashboard', href: '/admin/dashboard'}]},
  {label: 'Partners', href: '/admin/partners', items: []},
])}, error: null})})})})})}));
import {GET} from '../../apps/admin/app/api/admin/nav-config/route';

describe('persisted Admin navigation integration', () => {
  it('preserves configured sections and includes every Studio capability with canonical paths', async () => {
    const response = await GET(new NextRequest('https://admin.elevateforhumanity.org/api/admin/nav-config'));
    const result = await response.json();
    expect(result.source).toBe('db+canonical');
    expect(result.sections[0]).toMatchObject({label: 'Home', href: '/dashboard'});
    const studio = result.sections.find((section: {label: string}) => section.label === 'Dev Studio');
    expect(studio).toBeDefined();
    for (const workspace of STUDIO_WORKSPACES) expect(studio.items).toContainEqual({label: workspace.label, href: workspace.route});
    for (const section of result.sections) {
      const hrefs = section.items.map((item: {href: string}) => item.href);
      expect(hrefs.some((href: string) => href.startsWith('/admin/'))).toBe(false);
    }
  });
});

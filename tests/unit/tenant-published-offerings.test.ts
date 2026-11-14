import { describe, expect, it, vi } from 'vitest';
import { buildDefaultSiteConfig } from '@/lib/tenant/default-site-config';
import { loadPublishedOfferings } from '@/lib/tenant/published-offerings';

function fixture() {
  const config = buildDefaultSiteConfig({ organizationName: 'Legacy 83' });
  config.meta = { externalBackend: { projectRef: 'aaaaaaaaaaaaaaaaaaaa', url: 'https://aaaaaaaaaaaaaaaaaaaa.supabase.co', publishableKey: 'sb_publishable_example' } };
  config.pages = [{ id: 'academy', slug: '/academy', title: 'Academy', sections: [{ id: 'courses', type: 'services', content: { items: [{ title: 'Stale draft' }] }, settings: { source: 'published-courses' } }] }, { id: 'events', slug: '/events', title: 'Events', sections: [{ id: 'events', type: 'events', content: { items: [] }, settings: { source: 'published-events' } }] }];
  return config;
}

describe('tenant published offerings', () => {
  it('queries the configured customer only, filters drafts and past events, and excludes private fields', async () => {
    const request = vi.fn<typeof fetch>().mockImplementation(async url => {
      expect(String(url)).toContain('https://aaaaaaaaaaaaaaaaaaaa.supabase.co/rest/v1/');
      expect(String(url)).toContain('is_published=eq.true');
      return new Response(JSON.stringify(String(url).includes('academy_courses') ? [
        { title: 'Approved course', description: 'Public description', is_published: true, internal_notes: 'PRIVATE' },
        { title: 'Unfinished course', is_published: false },
      ] : [
        { title: 'Confirmed event', starts_at: '2027-01-01T18:00:00Z', registration_url: 'javascript:alert(1)', is_published: true },
        { title: 'Past event', starts_at: '2025-01-01T18:00:00Z', is_published: true },
        { title: 'Draft event', starts_at: '2027-01-01T18:00:00Z', is_published: false },
      ]));
    });
    const input = fixture();
    const result = await loadPublishedOfferings(input, request, new Date('2026-10-21T12:00:00Z'));
    expect(result.pages![0].sections[0].content.items).toEqual([{ title: 'Approved course', description: 'Public description', href: '/contact', buttonText: 'Ask about enrollment →' }]);
    const events = result.pages![1].sections[0].content.items as Array<Record<string, unknown>>;
    expect(events).toHaveLength(1);
    expect(events[0].href).toBe('/contact');
    expect(JSON.stringify(result)).not.toContain('PRIVATE');
    expect(input.pages![0].sections[0].content.items).toEqual([{ title: 'Stale draft' }]);
  });

  it('fails closed with a truthful availability message when the backend fails', async () => {
    const result = await loadPublishedOfferings(fixture(), vi.fn<typeof fetch>().mockResolvedValue(new Response('Unavailable', { status: 503 })));
    for (const page of result.pages!) {
      expect(page.sections[0].content.items).toEqual([]);
      expect(page.sections[0].content.emptyText).toContain('temporarily unavailable');
    }
  });

  it('never follows a mismatched project URL or sends a key to another destination', async () => {
    const config = fixture();
    config.meta!.externalBackend = { projectRef: 'aaaaaaaaaaaaaaaaaaaa', url: 'https://different.example', publishableKey: 'sb_publishable_example' };
    const request = vi.fn<typeof fetch>();
    await loadPublishedOfferings(config, request);
    expect(request).not.toHaveBeenCalled();
  });
});

import type { TenantSiteConfig } from './site-types';

type Row = Record<string, unknown>;
const text = (value: unknown) => typeof value === 'string' ? value : '';

/** Read public offerings through the customer's publishable key and RLS boundary. */
export async function loadPublishedOfferings(config: TenantSiteConfig, request: typeof fetch = fetch, now = new Date()): Promise<TenantSiteConfig> {
  if (!config.pages?.some(page => page.sections.some(section => ['published-courses', 'published-events'].includes(text(section.settings?.source))))) return config;
  const result = structuredClone(config);
  const backend = config.meta?.externalBackend;
  const details: Row = backend && typeof backend === 'object' && !Array.isArray(backend) ? backend as Row : {};
  const projectRef = text(details.projectRef), base = text(details.url), key = text(details.publishableKey);
  const configured = /^[a-z]{20}$/.test(projectRef) && base === `https://${projectRef}.supabase.co` && (key.startsWith('sb_publishable_') || key.startsWith('eyJ'));
  await Promise.all((result.pages || []).flatMap(page => page.sections).map(async section => {
    const source = text(section.settings?.source);
    if (source !== 'published-courses' && source !== 'published-events') return;
    const courses = source === 'published-courses';
    section.content.items = [];
    section.content.emptyText = courses ? 'Contact Legacy 83 for current learning opportunities and enrollment availability.' : 'No events are currently scheduled. Contact Legacy 83 for updates.';
    if (!configured) { section.content.emptyText = 'Current availability is temporarily unavailable. Please contact the business directly.'; return; }
    try {
      const url = new URL(`${base}/rest/v1/${courses ? 'academy_courses' : 'events'}`);
      url.searchParams.set('select', courses ? 'title,description,is_published' : 'title,description,starts_at,registration_url,is_published');
      url.searchParams.set('is_published', 'eq.true');
      url.searchParams.set('limit', '40');
      if (!courses) { url.searchParams.set('starts_at', `gte.${now.toISOString()}`); url.searchParams.set('order', 'starts_at.asc'); }
      const response = await request(url.toString(), { headers: { apikey: key }, cache: 'no-store', signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error('Published offerings lookup failed');
      const data: unknown = await response.json();
      if (!Array.isArray(data)) throw new Error('Invalid published offerings response');
      const items: Row[] = [];
      for (const raw of data) {
        if (!raw || typeof raw !== 'object') continue;
        const row = raw as Row;
        if (row.is_published !== true || !text(row.title)) continue;
        if (courses) { items.push({ title: text(row.title), description: text(row.description), href: '/contact', buttonText: 'Ask about enrollment →' }); continue; }
        const start = new Date(text(row.starts_at));
        if (!Number.isFinite(start.getTime()) || start < now) continue;
        const registration = text(row.registration_url);
        const external = /^https:\/\//i.test(registration);
        items.push({ title: text(row.title), description: text(row.description), date: start.toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'long', timeStyle: 'short' }), href: external ? registration : '/contact', buttonText: external ? 'Registration details' : 'Ask about this event' });
      }
      section.content.items = items;
    } catch {
      section.content.items = [];
      section.content.emptyText = 'Current availability is temporarily unavailable. Please contact the business directly.';
    }
  }));
  return result;
}

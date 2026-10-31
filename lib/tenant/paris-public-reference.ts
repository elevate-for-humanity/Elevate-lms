import type { TenantSiteConfig } from './site-types';

const REFERENCE_LIMIT = 8000;
const STOP_WORDS = new Set(['the', 'and', 'what', 'which', 'does', 'your', 'this', 'that', 'with', 'about', 'please', 'have', 'for', 'are', 'you']);
function publicValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return undefined;
  if (typeof value === 'string') return value.slice(0, 1400);
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value;
  if (Array.isArray(value)) return value.slice(0, 12).map(v => publicValue(v, depth + 1));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).slice(0, 30).map(([key, v]) => [key, publicValue(v, depth + 1)]));
  return undefined;
}

/** Bound public copy before inference. Sending a full multi-page site can exceed
 * the owned model's context before it has any room to answer. Hidden sections,
 * configuration metadata, credentials and applicant records never enter here. */
export function buildTenantParisPublicReference(config: TenantSiteConfig, message: string): string {
  const words = [...new Set(message.toLowerCase().match(/[a-z0-9]{3,}/g) || [])].filter(word => !STOP_WORDS.has(word)).slice(0, 20);
  const pages = (config.pages || []).map(page => ({ title: page.title, path: page.slug }));
  const ranked = (config.pages || []).flatMap((page, pageIndex) => page.sections.filter(section => section.visible !== false).map((section, sectionIndex) => {
    const value = { page: page.title, path: page.slug, type: section.type, content: publicValue(section.content) };
    const serialized = JSON.stringify(value);
    const searchable = serialized.toLowerCase();
    const score = words.reduce((sum, word) => sum + (page.title.toLowerCase().includes(word) ? 5 : 0) + (searchable.includes(word) ? 1 : 0), 0);
    return { value, serialized, score, order: pageIndex * 1000 + sectionIndex };
  })).sort((a, b) => b.score - a.score || a.order - b.order);
  const selected: unknown[] = [];
  for (const entry of ranked) {
    const candidate = JSON.stringify({ pages: pages.slice(0, 20), sections: [...selected, entry.value] });
    if (candidate.length <= REFERENCE_LIMIT) selected.push(entry.value);
  }
  return JSON.stringify({ pages: pages.slice(0, 20), sections: selected });
}

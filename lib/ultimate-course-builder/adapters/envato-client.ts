import { hydrateProcessEnv } from '@/lib/secrets';
import type { UltimateMediaSource } from '../media/media-acquisition';
import type { TeachingVisualRequirement, UltimateMediaCandidate } from '../media/media-director';

const API = 'https://api.envato.com';

function queryVariants(requirement: TeachingVisualRequirement) {
  const raw = [
    [requirement.action, requirement.subject, requirement.evidence].filter(Boolean).join(' '),
    [requirement.subject, requirement.action].filter(Boolean).join(' '),
    [requirement.subject, requirement.evidence].filter(Boolean).join(' '),
    requirement.subject,
  ].map((value) => String(value || '').trim()).filter(Boolean);
  return [...new Set(raw)].slice(0, 4);
}

export class UltimateEnvatoMarketClient implements UltimateMediaSource {
  private async get(path: string, params: Record<string, string>, attempt = 0): Promise<any> {
    await hydrateProcessEnv();
    const token = process.env.ENVATO_API_TOKEN?.trim();
    if (!token) throw new Error('ULTIMATE_ENVATO_TOKEN_MISSING');
    const url = new URL(path, API);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'User-Agent': 'Elevate Ultimate Course Builder/1.0',
      },
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(20000),
    });
    const contentType = response.headers.get('content-type') || '';
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location') || '';
      throw new Error(`ULTIMATE_ENVATO_REDIRECT_${response.status}:${location}`);
    }
    if (!response.ok) {
      if ((response.status === 429 || response.status >= 500) && attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        return this.get(path, params, attempt + 1);
      }
      throw new Error(`ULTIMATE_ENVATO_HTTP_${response.status}`);
    }
    if (!contentType.toLowerCase().includes('json')) {
      const preview = (await response.text()).slice(0, 160).replace(/\s+/g, ' ');
      throw new Error(`ULTIMATE_ENVATO_NON_JSON_RESPONSE:${contentType}:${preview}`);
    }
    try {
      return await response.json();
    } catch {
      throw new Error('ULTIMATE_ENVATO_INVALID_JSON');
    }
  }

  async search(requirement: TeachingVisualRequirement): Promise<UltimateMediaCandidate[]> {
    const seen = new Set<string>();
    const results: UltimateMediaCandidate[] = [];
    for (const term of queryVariants(requirement)) {
      const payload = await this.get('/v1/discovery/search/search/item', {
        term,
        site: 'videohive.net',
      });
      const rows = Array.isArray(payload.matches)
        ? payload.matches
        : Array.isArray(payload.results)
          ? payload.results
          : [];
      for (const row of rows.slice(0, 25)) {
        const id = String(row.id ?? row.item_id ?? '');
        if (!id || seen.has(id)) continue;
        seen.add(id);
        const haystack = `${row.name ?? ''} ${row.description ?? ''} ${row.tags ?? ''}`.toLowerCase();
        const terms = [requirement.action, requirement.subject, requirement.evidence]
          .flatMap((value) => String(value || '').toLowerCase().split(/[^a-z0-9]+/))
          .filter((value) => value.length >= 4);
        const matched = terms.filter((termValue) => haystack.includes(termValue)).length;
        const matchScore = terms.length ? Math.min(1, matched / Math.min(5, terms.length)) : 0;
        results.push({
          id,
          url: String(row.url ?? row.item_url ?? ''),
          source: 'envato',
          licenseVerified: true,
          matchScore,
        });
      }
      if (results.some((candidate) => candidate.matchScore >= 0.9)) break;
    }
    return results.sort((a, b) => b.matchScore - a.matchScore);
  }

  async acquire(candidate: UltimateMediaCandidate) {
    const payload = await this.get('/v3/market/buyer/download', { item_id: candidate.id });
    const url = String(payload.download_url ?? '');
    if (!url.startsWith('https://')) throw new Error('ULTIMATE_ENVATO_DOWNLOAD_URL_MISSING');
    const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error(`ULTIMATE_ENVATO_DOWNLOAD_HTTP_${response.status}`);
    const mimeType = response.headers.get('content-type') ?? 'application/octet-stream';
    if (/text\/html/i.test(mimeType))
      throw new Error(`ULTIMATE_ENVATO_DOWNLOAD_RETURNED_HTML:${mimeType}`);
    return {
      ...candidate,
      licenseVerified: true,
      download: { bytes: new Uint8Array(await response.arrayBuffer()), mimeType },
      licenseEvidence: {
        provider: 'envato',
        itemId: candidate.id,
        downloadedAt: new Date().toISOString(),
      },
    } as any;
  }
}

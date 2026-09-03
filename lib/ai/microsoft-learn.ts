/**
 * lib/ai/microsoft-learn.ts
 *
 * Microsoft Learn catalog integration.
 *
 * Microsoft Learn has a public catalog API at:
 *   https://learn.microsoft.com/api/catalog/?locale=en-us
 *
 * This module:
 *   1. Fetches modules from the MS Learn catalog
 *   2. Maps them to your existing Certiport exam codes
 *   3. Returns structured content for injection into the course builder AI context
 *   4. Caches results for 24h (catalog changes infrequently)
 *
 * No API key required — the catalog is public.
 */

import { logger } from '@/lib/logger';

const MS_LEARN_CATALOG_URL = 'https://learn.microsoft.com/api/catalog/?locale=en-us';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MSLearnModule {
  uid: string;
  title: string;
  summary: string;
  url: string;
  durationInMinutes: number;
  levels: string[];
  roles: string[];
  products: string[];
  subjects: string[];
  units: MSLearnUnit[];
}

export interface MSLearnUnit {
  uid: string;
  title: string;
  durationInMinutes: number;
  url: string;
}

export interface MSLearnLearningPath {
  uid: string;
  title: string;
  summary: string;
  url: string;
  durationInMinutes: number;
  modules: string[]; // module UIDs
}

export interface CertiportMSLearnMapping {
  examCode: string;
  examName: string;
  msLearnModules: MSLearnModule[];
  totalDurationMinutes: number;
  learningPaths: MSLearnLearningPath[];
}

// ── Certiport exam → MS Learn product/subject mapping ────────────────────────
// Maps your Certiport exam codes to MS Learn catalog filter terms.

const EXAM_TO_MSLEARN: Record<string, { products: string[]; subjects: string[]; roles: string[] }> = {
  // Microsoft Office Specialist
  'MOS-WORD-ASSOC':    { products: ['microsoft-365', 'word'], subjects: ['productivity'], roles: ['business-user'] },
  'MOS-WORD-EXPERT':   { products: ['microsoft-365', 'word'], subjects: ['productivity'], roles: ['business-user'] },
  'MOS-EXCEL-ASSOC':   { products: ['microsoft-365', 'excel'], subjects: ['data-analysis', 'productivity'], roles: ['business-user', 'data-analyst'] },
  'MOS-EXCEL-EXPERT':  { products: ['microsoft-365', 'excel'], subjects: ['data-analysis'], roles: ['data-analyst'] },
  'MOS-POWERPOINT':    { products: ['microsoft-365', 'powerpoint'], subjects: ['productivity'], roles: ['business-user'] },
  'MOS-OUTLOOK':       { products: ['microsoft-365', 'outlook'], subjects: ['productivity'], roles: ['business-user'] },
  'MOS-ACCESS':        { products: ['microsoft-365', 'access'], subjects: ['data-management'], roles: ['database-administrator'] },
  // Microsoft Technology Associate
  'MTA-NETWORKING':    { products: ['windows-server'], subjects: ['networking'], roles: ['administrator'] },
  'MTA-SECURITY':      { products: ['azure', 'microsoft-365'], subjects: ['security'], roles: ['security-engineer'] },
  'MTA-WINDOWS-OS':    { products: ['windows'], subjects: ['infrastructure'], roles: ['administrator'] },
  'MTA-CLOUD':         { products: ['azure'], subjects: ['cloud-computing'], roles: ['administrator'] },
  // IC3 Digital Literacy
  'IC3-GS6':           { products: ['microsoft-365'], subjects: ['digital-literacy', 'productivity'], roles: ['business-user'] },
  // CompTIA (via Certiport)
  'COMPTIA-IT-SPEC':   { products: ['windows', 'azure'], subjects: ['infrastructure', 'networking'], roles: ['administrator'] },
  'COMPTIA-CYBER':     { products: ['azure', 'microsoft-365'], subjects: ['security', 'compliance'], roles: ['security-engineer'] },
  // Azure Fundamentals (maps to your IT programs)
  'AZ-900':            { products: ['azure'], subjects: ['cloud-computing'], roles: ['administrator', 'developer'] },
  'SC-900':            { products: ['azure', 'microsoft-365'], subjects: ['security', 'compliance'], roles: ['security-engineer'] },
};

// ── In-memory cache ───────────────────────────────────────────────────────────

let _catalogCache: { modules: MSLearnModule[]; paths: MSLearnLearningPath[]; fetchedAt: number } | null = null;

async function fetchCatalog(): Promise<{ modules: MSLearnModule[]; paths: MSLearnLearningPath[] }> {
  if (_catalogCache && Date.now() - _catalogCache.fetchedAt < CACHE_TTL_MS) {
    return { modules: _catalogCache.modules, paths: _catalogCache.paths };
  }

  try {
    const res = await fetch(MS_LEARN_CATALOG_URL, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 86400 }, // Next.js fetch cache: 24h
    });

    if (!res.ok) throw new Error(`MS Learn catalog returned ${res.status}`);

    const data = await res.json();

    const modules: MSLearnModule[] = (data.modules || []).map((m: any) => ({
      uid: m.uid,
      title: m.title,
      summary: m.summary || '',
      url: m.url,
      durationInMinutes: m.duration_in_minutes || 0,
      levels: m.levels || [],
      roles: m.roles || [],
      products: m.products || [],
      subjects: m.subjects || [],
      units: (m.units || []).map((u: any) => ({
        uid: u.uid,
        title: u.title,
        durationInMinutes: u.duration_in_minutes || 0,
        url: u.url,
      })),
    }));

    const paths: MSLearnLearningPath[] = (data.learningPaths || []).map((p: any) => ({
      uid: p.uid,
      title: p.title,
      summary: p.summary || '',
      url: p.url,
      durationInMinutes: p.duration_in_minutes || 0,
      modules: p.modules || [],
    }));

    _catalogCache = { modules, paths, fetchedAt: Date.now() };
    logger.info(`[ms-learn] Catalog fetched: ${modules.length} modules, ${paths.length} paths`);

    return { modules, paths };
  } catch (err) {
    logger.error('[ms-learn] Failed to fetch catalog', err);
    return { modules: [], paths: [] };
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Get MS Learn modules that map to a specific Certiport exam code.
 * Returns up to 10 most relevant modules sorted by relevance score.
 */
export async function getMSLearnModulesForExam(examCode: string): Promise<CertiportMSLearnMapping | null> {
  const mapping = EXAM_TO_MSLEARN[examCode];
  if (!mapping) return null;

  const { modules, paths } = await fetchCatalog();

  // Score each module by how many filter terms match
  const scored = modules.map((m) => {
    let score = 0;
    for (const p of mapping.products) {
      if (m.products.some((mp) => mp.toLowerCase().includes(p.toLowerCase()))) score += 3;
    }
    for (const s of mapping.subjects) {
      if (m.subjects.some((ms) => ms.toLowerCase().includes(s.toLowerCase()))) score += 2;
    }
    for (const r of mapping.roles) {
      if (m.roles.some((mr) => mr.toLowerCase().includes(r.toLowerCase()))) score += 1;
    }
    return { module: m, score };
  });

  const relevant = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((s) => s.module);

  // Find learning paths that contain any of these modules
  const relevantModuleUids = new Set(relevant.map((m) => m.uid));
  const relevantPaths = paths
    .filter((p) => p.modules.some((uid) => relevantModuleUids.has(uid)))
    .slice(0, 3);

  const totalDuration = relevant.reduce((sum, m) => sum + m.durationInMinutes, 0);

  // Get exam name from Certiport catalog
  const { CERTIPORT_EXAMS } = await import('@/lib/partners/certiport');
  const exam = (CERTIPORT_EXAMS as any)[examCode];

  return {
    examCode,
    examName: exam?.name ?? examCode,
    msLearnModules: relevant,
    totalDurationMinutes: totalDuration,
    learningPaths: relevantPaths,
  };
}

/**
 * Get MS Learn modules for all Certiport exams in a given category.
 * Used by the course builder to enrich IT/technology course generation.
 */
export async function getMSLearnModulesForCategory(category: string): Promise<MSLearnModule[]> {
  const { modules } = await fetchCatalog();

  const categoryMap: Record<string, string[]> = {
    'Microsoft Office': ['microsoft-365', 'word', 'excel', 'powerpoint', 'outlook', 'access'],
    'IT Fundamentals':  ['windows', 'windows-server', 'azure'],
    'Cybersecurity':    ['azure', 'microsoft-365'],
    'Cloud':            ['azure'],
    'Data':             ['excel', 'power-bi', 'azure'],
  };

  const products = categoryMap[category] || [];
  if (!products.length) return [];

  return modules
    .filter((m) => m.products.some((p) => products.some((cp) => p.toLowerCase().includes(cp))))
    .slice(0, 20);
}

/**
 * Build a context string for injection into the course builder AI prompt.
 * Includes MS Learn module titles and summaries for the given exam.
 */
export async function buildMSLearnContext(examCode: string): Promise<string> {
  const mapping = await getMSLearnModulesForExam(examCode);
  if (!mapping || mapping.msLearnModules.length === 0) return '';

  const moduleList = mapping.msLearnModules
    .slice(0, 6)
    .map((m) => `- ${m.title} (${m.durationInMinutes}min): ${m.summary.slice(0, 120)}`)
    .join('\n');

  const pathList = mapping.learningPaths
    .map((p) => `- ${p.title}: ${p.summary.slice(0, 100)}`)
    .join('\n');

  return `
## Microsoft Learn Content for ${mapping.examName}

The following free Microsoft Learn modules cover this exam's objectives.
Use these as reference for lesson topics, learning objectives, and content depth.

### Relevant Modules (${mapping.totalDurationMinutes} min total):
${moduleList}

${pathList ? `### Learning Paths:\n${pathList}` : ''}

Source: learn.microsoft.com (free, publicly available)
`.trim();
}

/**
 * Search MS Learn catalog by keyword — used by the course builder AI assistant.
 */
export async function searchMSLearn(query: string, limit = 10): Promise<MSLearnModule[]> {
  const { modules } = await fetchCatalog();
  const q = query.toLowerCase();

  return modules
    .filter((m) =>
      m.title.toLowerCase().includes(q) ||
      m.summary.toLowerCase().includes(q) ||
      m.subjects.some((s) => s.toLowerCase().includes(q)) ||
      m.products.some((p) => p.toLowerCase().includes(q)),
    )
    .slice(0, limit);
}

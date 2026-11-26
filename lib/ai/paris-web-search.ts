/**
 * PARIS web search — server-side web results for questions Elevate's own
 * program catalog cannot answer.
 *
 * The owned model cannot browse and has no tool calls, so when a visitor asks
 * about something outside the catalog (state licensing rules, job-market pay,
 * general definitions), the facts have to reach it through the prompt, the
 * same way lib/ai/paris-site-facts.ts injects verified program facts.
 *
 * Provider order:
 *   1. Tavily, when TAVILY_API_KEY is set.
 *   2. Brave, when BRAVE_SEARCH_API_KEY is set.
 *   3. Keyless fallback (no account, no key): DuckDuckGo Instant Answers plus
 *      Wikipedia search, in parallel. Verified limits of the keyless path:
 *      DuckDuckGo Instant Answers returns an abstract only for narrow entity
 *      or definition lookups and is empty for most general queries; Wikipedia
 *      search is reliable for general/encyclopedic facts but is not a source
 *      for local or breaking information. A paid key upgrades this to full
 *      web results.
 *
 * Discipline: the search runs only when the site-facts retrieval found no
 * confident program match, or the question carries an external-world signal
 * (see shouldWebSearch) — questions the catalog covers never pay the latency.
 * Every call is hard-capped (~4s) and fails open: any error, timeout, or
 * empty response returns [], and PARIS answers from site facts and its own
 * knowledge exactly as it did before this module existed. Web results never
 * override the verified site facts; the route's prompt wording says so.
 */

export interface ParisWebResult {
  title: string;
  snippet: string;
  url: string;
}

export type ParisWebSearchProvider = 'tavily' | 'brave' | 'keyless';

export const WEB_SEARCH_TIMEOUT_MS = 4000;
export const MAX_WEB_RESULTS = 4;

const MAX_SNIPPET_CHARS = 240;
const MAX_TITLE_CHARS = 120;
const MAX_QUERY_CHARS = 300;

type Env = Record<string, string | undefined>;
type Fetcher = typeof fetch;

export interface ParisWebSearchOptions {
  env?: Env;
  fetcher?: Fetcher;
  timeoutMs?: number;
}

/** Which provider a call would use, from the environment alone. */
export function selectWebSearchProvider(env: Env = process.env): ParisWebSearchProvider {
  if (env.TAVILY_API_KEY?.trim()) return 'tavily';
  if (env.BRAVE_SEARCH_API_KEY?.trim()) return 'brave';
  return 'keyless';
}

const GREETING_ONLY =
  /^(hi|hello|hey|thanks|thank you|ok|okay|yes|no|bye|goodbye|good morning|good afternoon|good evening|sure|cool|great)[\s!.]*$/i;

/**
 * External-world signals: even when a program matched, these questions ask
 * about something Elevate's catalog does not record — what a job pays in the
 * field, what the state requires, how two credentials differ, a recent rule
 * change. Program-detail questions (cost, duration, schedule, funding) match
 * none of these and stay on the fast path.
 */
const EXTERNAL_PATTERNS: RegExp[] = [
  /\bhow much do(?:es)? (?:a|an|the) [\w\s]+? (?:earn|make|get paid)\b/i,
  /\b(?:average|median|typical) (?:salary|pay|wage|earnings|income)\b/i,
  /\b(?:state|indiana|federal) (?:requirements?|laws?|regulations?|licensing|rules?)\b/i,
  /\blicen[cs]e requirements?\b/i,
  /\bwhat(?:'s| is) the difference between\b/i,
  /\b(?:latest|newest|recent|current|updated) (?:law|rule|regulation|requirement|guideline)s?\b/i,
];

/**
 * Should this question pay for a web search?
 *
 * - No confident program match (matchedProgramCount === 0): yes — the
 *   catalog cannot answer it, so the web is the only source of new facts.
 * - A program matched: only when an external-world signal is present.
 * - Greetings and one-word replies never search.
 */
export function shouldWebSearch(message: string, matchedProgramCount: number): boolean {
  const text = (message || '').trim();
  if (text.length < 8) return false;
  if (GREETING_ONLY.test(text)) return false;
  if (matchedProgramCount <= 0) return true;
  return EXTERNAL_PATTERNS.some((pattern) => pattern.test(text));
}

function cleanText(text: string): string {
  return (text || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Strip markup, cap lengths, drop empties, dedupe by URL, cap the count. */
function normalizeResults(raw: ParisWebResult[]): ParisWebResult[] {
  const seen = new Set<string>();
  const results: ParisWebResult[] = [];
  for (const item of raw) {
    const url = (item.url || '').trim();
    const title = truncate(cleanText(item.title), MAX_TITLE_CHARS);
    const snippet = truncate(cleanText(item.snippet), MAX_SNIPPET_CHARS);
    if (!url || !snippet || seen.has(url)) continue;
    seen.add(url);
    results.push({ title: title || url, snippet, url });
    if (results.length >= MAX_WEB_RESULTS) break;
  }
  return results;
}

async function searchTavily(
  query: string,
  apiKey: string,
  fetcher: Fetcher,
  signal: AbortSignal,
): Promise<ParisWebResult[]> {
  const response = await fetcher('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: MAX_WEB_RESULTS,
      search_depth: 'basic',
      include_answer: false,
    }),
    signal,
  });
  if (!response.ok) return [];
  const data = (await response.json()) as {
    results?: Array<{ title?: string; content?: string; url?: string }>;
  };
  return normalizeResults(
    (data.results || []).map((result) => ({
      title: result.title || '',
      snippet: result.content || '',
      url: result.url || '',
    })),
  );
}

async function searchBrave(
  query: string,
  apiKey: string,
  fetcher: Fetcher,
  signal: AbortSignal,
): Promise<ParisWebResult[]> {
  const url =
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}` +
    `&count=${MAX_WEB_RESULTS}`;
  const response = await fetcher(url, {
    headers: { Accept: 'application/json', 'X-Subscription-Token': apiKey },
    signal,
  });
  if (!response.ok) return [];
  const data = (await response.json()) as {
    web?: { results?: Array<{ title?: string; description?: string; url?: string }> };
  };
  return normalizeResults(
    (data.web?.results || []).map((result) => ({
      title: result.title || '',
      snippet: result.description || '',
      url: result.url || '',
    })),
  );
}

async function duckDuckGoInstant(
  query: string,
  fetcher: Fetcher,
  signal: AbortSignal,
): Promise<ParisWebResult[]> {
  const url =
    `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}` +
    '&format=json&no_html=1&skip_disambig=1';
  const response = await fetcher(url, { headers: { Accept: 'application/json' }, signal });
  if (!response.ok) return [];
  const data = (await response.json()) as {
    Heading?: string;
    AbstractText?: string;
    AbstractURL?: string;
    Answer?: string;
    Definition?: string;
    DefinitionURL?: string;
    RelatedTopics?: Array<{
      Text?: string;
      FirstURL?: string;
      Topics?: Array<{ Text?: string; FirstURL?: string }>;
    }>;
  };
  const results: ParisWebResult[] = [];
  if (data.AbstractText) {
    results.push({
      title: data.Heading || 'DuckDuckGo Instant Answer',
      snippet: data.AbstractText,
      url: data.AbstractURL || 'https://duckduckgo.com/',
    });
  } else if (data.Answer) {
    results.push({
      title: data.Heading || 'DuckDuckGo Instant Answer',
      snippet: data.Answer,
      url: 'https://duckduckgo.com/',
    });
  } else if (data.Definition) {
    results.push({
      title: data.Heading || 'Definition',
      snippet: data.Definition,
      url: data.DefinitionURL || 'https://duckduckgo.com/',
    });
  }
  const topics = (data.RelatedTopics || []).flatMap((topic) =>
    topic.Topics?.length ? topic.Topics : [topic],
  );
  for (const topic of topics) {
    if (!topic.Text || !topic.FirstURL) continue;
    const [head, ...rest] = topic.Text.split(' - ');
    results.push({
      title: rest.length && head.length <= MAX_TITLE_CHARS ? head : topic.Text,
      snippet: topic.Text,
      url: topic.FirstURL,
    });
  }
  return results;
}

async function wikipediaSearch(
  query: string,
  fetcher: Fetcher,
  signal: AbortSignal,
): Promise<ParisWebResult[]> {
  const url =
    `https://en.wikipedia.org/w/api.php?action=query&list=search` +
    `&srsearch=${encodeURIComponent(query)}&srlimit=${MAX_WEB_RESULTS}&format=json&utf8=1`;
  const response = await fetcher(url, {
    headers: {
      Accept: 'application/json',
      // Wikipedia's API policy asks for a descriptive User-Agent.
      'User-Agent': 'ElevatePARIS/1.0 (https://www.elevateforhumanity.org; PARIS web search)',
    },
    signal,
  });
  if (!response.ok) return [];
  const data = (await response.json()) as {
    query?: { search?: Array<{ title?: string; snippet?: string }> };
  };
  return (data.query?.search || []).map((result) => ({
    title: result.title || '',
    snippet: result.snippet || '',
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent((result.title || '').replace(/ /g, '_'))}`,
  }));
}

/**
 * Keyless path: DuckDuckGo Instant Answers (strong when it fires — direct
 * answers and definitions) plus Wikipedia search (general facts), in
 * parallel under the same abort signal. Either source failing leaves the
 * other; both failing returns [].
 */
async function searchKeyless(
  query: string,
  fetcher: Fetcher,
  signal: AbortSignal,
): Promise<ParisWebResult[]> {
  const [instant, wiki] = await Promise.allSettled([
    duckDuckGoInstant(query, fetcher, signal),
    wikipediaSearch(query, fetcher, signal),
  ]);
  const results: ParisWebResult[] = [];
  if (instant.status === 'fulfilled') results.push(...instant.value);
  if (wiki.status === 'fulfilled') results.push(...wiki.value);
  return normalizeResults(results);
}

/**
 * Search the web for a visitor question. Fails open: returns [] on any
 * error, timeout, or empty response, and never throws.
 */
export async function searchWebForParis(
  query: string,
  options: ParisWebSearchOptions = {},
): Promise<ParisWebResult[]> {
  const env = options.env ?? process.env;
  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = options.timeoutMs ?? WEB_SEARCH_TIMEOUT_MS;
  const prepared = (query || '').replace(/\s+/g, ' ').trim().slice(0, MAX_QUERY_CHARS);
  if (!prepared) return [];

  const provider = selectWebSearchProvider(env);
  const work = (async (): Promise<ParisWebResult[]> => {
    try {
      const signal = AbortSignal.timeout(timeoutMs);
      if (provider === 'tavily') {
        return await searchTavily(prepared, env.TAVILY_API_KEY as string, fetcher, signal);
      }
      if (provider === 'brave') {
        return await searchBrave(prepared, env.BRAVE_SEARCH_API_KEY as string, fetcher, signal);
      }
      return await searchKeyless(prepared, fetcher, signal);
    } catch {
      return [];
    }
  })();

  // Hard bound even if an underlying fetch ignores the abort signal.
  let timer: ReturnType<typeof setTimeout> | undefined;
  const guard = new Promise<ParisWebResult[]>((resolve) => {
    timer = setTimeout(() => resolve([]), timeoutMs + 500);
    (timer as unknown as { unref?: () => void }).unref?.();
  });
  try {
    return await Promise.race([work, guard]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Numbered results with source URLs, ready to append to the PARIS prompt. */
export function formatWebResults(results: ParisWebResult[]): string {
  if (!results.length) return '';
  return results
    .map((result, index) => `${index + 1}. ${result.title} — ${result.url}\n   ${result.snippet}`)
    .join('\n');
}

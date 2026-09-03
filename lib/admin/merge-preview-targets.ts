export interface PreviewTarget {
  label: string;
  url: string;
}

/**
 * Merges dashboard seed targets with Dev Studio config targets.
 * Config entries win on duplicate URLs; order is config first, then extras from dashboard.
 */
export function mergePreviewTargets(
  dashboardTargets: PreviewTarget[],
  configTargets: PreviewTarget[] | undefined,
): PreviewTarget[] {
  const fromConfig = configTargets ?? [];
  if (fromConfig.length === 0) {
    return dedupeTargets(dashboardTargets);
  }

  const seen = new Set<string>();
  const merged: PreviewTarget[] = [];

  for (const target of fromConfig) {
    const key = normalizeUrlKey(target.url);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(target);
  }

  for (const target of dashboardTargets) {
    const key = normalizeUrlKey(target.url);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(target);
  }

  return merged;
}

function dedupeTargets(targets: PreviewTarget[]): PreviewTarget[] {
  const seen = new Set<string>();
  const out: PreviewTarget[] = [];
  for (const target of targets) {
    const key = normalizeUrlKey(target.url);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(target);
  }
  return out;
}

function normalizeUrlKey(url: string): string {
  try {
    const parsed = new URL(url.trim());
    return parsed.origin + parsed.pathname.replace(/\/$/, '') || parsed.origin;
  } catch {
    return '';
  }
}

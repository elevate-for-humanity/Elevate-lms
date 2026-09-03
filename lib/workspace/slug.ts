const RESERVED_SLUGS = new Set([
  'www',
  'app',
  'api',
  'admin',
  'dashboard',
  'mail',
  'support',
  'help',
  'docs',
  'demo',
  'store',
  'login',
]);

export function slugifyWorkspaceName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

export function normalizeWorkspaceSlug(raw: string): string {
  const slug = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

  if (!slug || slug.length < 2) {
    throw new Error('Workspace slug must be at least 2 characters');
  }

  if (RESERVED_SLUGS.has(slug)) {
    throw new Error('Workspace slug is reserved');
  }

  return slug;
}

export function ensureUniqueSlugCandidate(base: string, taken: boolean): string {
  if (!taken) return base;
  return `${base}-${Date.now().toString(36).slice(-4)}`;
}

import { headers } from 'next/headers';

export async function getTenantSlugFromHeaders(): Promise<string | null> {
  const h = await headers();
  const slug = h.get('x-tenant-slug');
  return slug?.trim() || null;
}

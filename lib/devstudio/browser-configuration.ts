/** Server runtime URLs take precedence over a historical public build value. */
export function browserConfiguration(env: Record<string, string | undefined>) {
  const internalUrl = (env.STUDIO_BROWSER_URL || '').replace(/\/$/, '');
  const publicUrl = (env.STUDIO_BROWSER_PUBLIC_URL || env.NEXT_PUBLIC_STUDIO_BROWSER_URL || '').replace(/\/$/, '');
  const secret = env.STUDIO_BROWSER_SECRET || '';
  return { internalUrl, publicUrl, secret, configured: !!(internalUrl && publicUrl && secret) };
}

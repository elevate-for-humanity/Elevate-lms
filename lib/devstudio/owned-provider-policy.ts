export const OWNED_STUDIO_PROVIDER = 'elevate' as const;

/** Dev Studio is restricted to the owner's engine, including failure paths. */
export function isOwnedStudioProviderRequest(provider: unknown): boolean {
  if (provider === undefined || provider === null) return true;
  return (
    typeof provider === 'string' &&
    ['', 'auto', OWNED_STUDIO_PROVIDER].includes(provider.trim().toLowerCase())
  );
}

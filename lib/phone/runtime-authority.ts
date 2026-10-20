/** Phone settings can move to Google independently of other application settings. */
export function usesGooglePhoneBindings(environment: Record<string, string | undefined> = process.env): boolean {
  return (environment.PBX_RUNTIME_CONFIG_PROVIDER || environment.ELEVATE_RUNTIME_CONFIG_PROVIDER) === 'google-secret-manager';
}

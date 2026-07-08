export const APP_VERSION = process.env.COMMIT_REF?.slice(0, 7) || 'dev';
export const BUILD_ID = process.env.BUILD_ID || process.env.COMMIT_REF || 'local';

export function checkVersionMismatch(): boolean {
  if (typeof window === 'undefined') return false;

  const storedVersion = localStorage.getItem('app_version');
  const currentVersion = APP_VERSION;

  if (storedVersion && storedVersion !== currentVersion) {
    return true;
  }

  localStorage.setItem('app_version', currentVersion);
  return false;
}

export function clearVersionAndReload() {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('app_version');
  location.replace('/reset?reason=version_mismatch&ts=' + Date.now());
}

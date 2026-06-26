export function checkVersionMismatch(current: string, required: string): boolean {
  return current !== required;
}

export function getAppVersion(): string {
  return process.env.npm_package_version || '1.0.0';
}

export const avatarConfig = { size: 40, shape: 'circle' };

// Re-exported from lib/avatar for compatibility
export type AvatarContext = 'default' | 'instructor' | 'mentor' | 'employer';
export type AvatarRole = 'guide' | 'helper' | 'evaluator';
export type AvatarIntent = 'welcome' | 'help' | 'feedback' | 'reminder';

export function getPageLoadMessage(page: string): string {
  return `Welcome to ${page}`;
}

export function shouldSpeakOnLoad(page: string): boolean {
  return true;
}

export function isAvatarEnabled(): boolean {
  return true;
}

export function validateNoDuplicates(): void {
  // No-op stub
}

export function resetSpokenPages(): void {
  // No-op stub
}

export function getAvatarConfig() {
  return avatarConfig;
}

export const PAGE_AVATAR_CONFIGS: Record<string, object> = {};

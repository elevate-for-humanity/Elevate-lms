/**
 * Avatar System - Public API
 *
 * Usage:
 * ```tsx
 * import { useAvatarOnLoad, getAvatarContextForRoute } from '@/lib/avatar';
 * ```
 */

// Hooks
export { useAvatarOnLoad, useAvatarListener } from './useAvatarOnLoad';

// Route mapping
export {
  getAvatarContextForRoute,
  shouldRouteHaveAvatar,
  getAvatarEnabledRoutes,
  type RouteAvatarContext,
  type PageType,
  type ProgramCategory,
} from './avatarRouteMap';

// Config (re-export from parent)
export {
  getPageLoadMessage,
  shouldSpeakOnLoad,
  isAvatarEnabled,
  validateNoDuplicates,
  resetSpokenPages,
  getAvatarConfig,
  PAGE_AVATAR_CONFIGS,
  type AvatarContext,
  type AvatarRole,
  type AvatarIntent,
} from '../avatar-config';

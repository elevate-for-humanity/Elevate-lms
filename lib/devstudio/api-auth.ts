/**
 * DevStudio API authentication — admin role required.
 * No platform operator restriction — any admin can access Dev Studio.
 */

export {
  apiRequireAdmin as apiRequireDevStudio,
  type GuardedUser,
} from '@/lib/admin/guards';

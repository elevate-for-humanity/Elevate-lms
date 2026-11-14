import { redirect } from 'next/navigation';

/**
 * Compatibility entry for older Admin PWA installs and bookmarks.
 * The single operational Admin AI workspace is /studio.
 */
export default function LegacyAdminAiStudioPage() {
  redirect('/studio');
}

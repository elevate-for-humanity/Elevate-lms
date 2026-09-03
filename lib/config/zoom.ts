/**
 * Central Zoom configuration.
 * Meetings are created dynamically via the Server-to-Server OAuth API
 * (lib/integrations/zoom.ts). This file provides a helper and a
 * configuration check for pages that need Zoom.
 */

// Re-export the meeting creator so consumers can import from one place
export { createZoomMeeting } from '@/lib/integrations/zoom';

/**
 * Whether the Zoom API is configured (all required env vars present).
 */
export function isZoomConfigured(): boolean {
  return !!(
    process.env.ZOOM_ACCOUNT_ID &&
    process.env.ZOOM_CLIENT_ID &&
    process.env.ZOOM_CLIENT_SECRET
  );
}

'use client';

import { useBuildVersion } from '@/lib/hooks/useBuildVersion';

/**
 * Compatibility mount for the canonical PWA registration.
 *
 * The Admin and LMS service workers activate in the background and network
 * navigations fetch the serving application. Showing a site-wide "Update now"
 * banner on every controller/build change produced a repeated, ineffective
 * reload prompt and interrupted active Studio/forms.
 *
 * Retain the loaded-build version check for diagnostics, but do not render
 * a prompt or force a reload. A new build is loaded on the next safe
 * navigation/reopen; never discard an in-progress task or unsaved form.
 */
export function PwaUpdateNotice() {
  useBuildVersion();
  return null;
}

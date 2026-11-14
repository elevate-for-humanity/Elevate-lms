'use client';

/**
 * Component that syncs build version to prevent Server Action mismatches.
 * Add to layout to enable proactive build detection.
 */
import { useBuildVersion } from '@/lib/hooks/useBuildVersion';

export default function BuildVersionSync() {
  useBuildVersion();
  return null; // Invisible component
}

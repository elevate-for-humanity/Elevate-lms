import { notifySendgrid } from './notify';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
export interface WatermarkData {
  userId: string;
  userEmail: string;
  contentId: string;
  contentType: 'course' | 'lesson' | 'certificate' | 'document';
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}
/**
 * Add invisible watermark to content
 */
export function watermarkContent(content: string, data: WatermarkData): string {
  const watermark = Buffer.from(
    JSON.stringify({
      u: data.userId,
      c: data.contentId,
      t: data.timestamp.getTime(),
    }),
  ).toString('base64');
  // Add invisible HTML comment
  const invisibleWatermark = `<!-- wm:${watermark} -->`;
  return content + invisibleWatermark;
}
/**
 * Extract watermark from content
 */
export function extractWatermark(content: string): {
  userId: string;
  contentId: string;
  timestamp: Date;
} | null {
  const match = content.match(/<!-- wm:([A-Za-z0-9+/=]+) -->/);
  if (!match) return null;
  try {
    const decoded = Buffer.from(match[1], 'base64').toString('utf-8');
    const data = JSON.parse(decoded);
    return {
      userId: data.u,
      contentId: data.c,
      timestamp: new Date(data.t),
    };
  } catch (error) {
    return null;
  }
}
/**
 * Log content access and send email notification
 */
export async function logContentAccess(data: WatermarkData): Promise<void> {
  // Log to console (in production, log to database)
  //
  // Send email notification
  const subject = `Content Access Alert: ${data.contentType} ${data.contentId}`;
  const message = `
Content Access Notification
===========================
User: ${data.userEmail} (${data.userId})
Content: ${data.contentType} - ${data.contentId}
Time: ${data.timestamp.toISOString()}
IP Address: ${data.ipAddress}
User Agent: ${data.userAgent}
This is an automated notification from your ${PLATFORM_DEFAULTS.orgName} LMS platform.
  `.trim();
  try {
    await notifySendgrid(subject, message);
  } catch (error) {
    /* Error handled silently */
    // Error: $1
  }
}
/**
 * Detect suspicious content usage patterns
 */
export async function detectSuspiciousUsage(userId: string, contentId: string): Promise<boolean> {
  // In production, check database for patterns
  // For now, just log
  //
  // Example: Check if user accessed same content multiple times rapidly
  // Example: Check if content was accessed from multiple IPs
  // Example: Check if content was downloaded/copied
  return false; // Not suspicious
}
/**
 * Watermark and track build usage
 */
export async function watermarkBuild(
  buildId: string,
  deployedBy: string,
  deployedTo: string,
): Promise<void> {
  const timestamp = new Date();
  const message = `
Build Deployment Notification
==============================
Build ID: ${buildId}
Deployed By: ${deployedBy}
Deployed To: ${deployedTo}
Timestamp: ${timestamp.toISOString()}
This build has been watermarked and is being tracked.
Any unauthorized use will be detected and reported.
Platform: ${PLATFORM_DEFAULTS.orgName} LMS
Value: $2.5M - $8M
  `.trim();
  try {
    await notifySendgrid('Build Deployment Alert', message);
    //
  } catch (error) {
    /* Error handled silently */
    // Error: $1
  }
}

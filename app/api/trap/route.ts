import { NextRequest, NextResponse } from 'next/server';
// AUTH: Intentionally public — no authentication required


export const maxDuration = 60;
import { logSecurityEvent, blacklistIP } from '@/lib/security-monitor';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

/**
 * Honeypot endpoint - should never be accessed by legitimate users
 * Any access to this endpoint indicates a bot or scraper
 */
async function _GET(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') ||
             'unknown';

  const userAgent = req.headers.get('user-agent') || 'unknown';

  // Log the bot detection
  await logSecurityEvent({
    type: 'bot_detected',
    severity: 'high',
    ip,
    userAgent,
    endpoint: '/api/trap',
    details: {
      message: 'Honeypot endpoint accessed',
      headers: Object.fromEntries(req.headers.entries()),
    },
    timestamp: new Date(),
  });

  // Blacklist the IP
  await blacklistIP(ip, 'Accessed honeypot endpoint');

  // Return fake data to waste bot's time
  const fakeData = Array(1000).fill(null).map((_, i) => ({
    id: `fake-${i}`,
    title: `Fake Course ${i}`,
    description: 'This is fake data designed to waste scraper resources',
    price: Math.random() * 1000,
    instructor: `Fake Instructor ${i}`,
    students: Math.floor(Math.random() * 10000),
    rating: Math.random() * 5,
    url: `/fake/course/${i}`,
  }));

  // Add delay to waste bot's time
  await new Promise(resolve => setTimeout(resolve, 5000));

  return NextResponse.json({
    success: true,
    data: fakeData,
    message: 'You have been identified as a bot and blacklisted',
  });
}

async function _POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  return GET(req);
}
export const GET = withApiAudit('/api/trap', _GET);
export const POST = withApiAudit('/api/trap', _POST);

// AI Scraping Protection System
// Detects and blocks automated content scraping attempts

export interface ScrapingAttempt {
  ip: string;
  userAgent: string;
  timestamp: Date;
  endpoint: string;
  suspicious: boolean;
  reason?: string;
}

// Known AI/Bot user agents
const AI_BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /GPTBot/i,
  /ChatGPT/i,
  /Claude/i,
  /Anthropic/i,
  /OpenAI/i,
  /Bard/i,
  /Gemini/i,
  /PerplexityBot/i,
  /Applebot/i,
  /facebookexternalhit/i,
  /LinkedInBot/i,
  /Slackbot/i,
  /Discordbot/i,
  /TelegramBot/i,
  /WhatsApp/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /axios/i,
  /node-fetch/i,
  /scrapy/i,
  /beautifulsoup/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i,
];

// Rate limiting thresholds
const RATE_LIMITS = {
  requests_per_minute: 60,
  requests_per_hour: 500,
  requests_per_day: 5000,
};

// In-memory store (use Redis in production)
const requestLog = new Map<string, number[]>();
const blockedIPs = new Set<string>();

export function detectAIBot(userAgent: string): boolean {
  return AI_BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const requests = requestLog.get(ip) || [];

  // Clean old requests (older than 24 hours)
  const recentRequests = requests.filter((time) => now - time < 24 * 60 * 60 * 1000);

  // Check rate limits
  const lastMinute = recentRequests.filter((time) => now - time < 60 * 1000).length;
  const lastHour = recentRequests.filter((time) => now - time < 60 * 60 * 1000).length;
  const lastDay = recentRequests.length;

  return (
    lastMinute > RATE_LIMITS.requests_per_minute ||
    lastHour > RATE_LIMITS.requests_per_hour ||
    lastDay > RATE_LIMITS.requests_per_day
  );
}

export function logRequest(ip: string): void {
  const now = Date.now();
  const requests = requestLog.get(ip) || [];
  requests.push(now);
  requestLog.set(ip, requests);
}

export function blockIP(ip: string, duration: number = 24 * 60 * 60 * 1000): void {
  blockedIPs.add(ip);

  // Auto-unblock after duration
  setTimeout(() => {
    blockedIPs.delete(ip);
  }, duration);
}

export function isBlocked(ip: string): boolean {
  return blockedIPs.has(ip);
}

export function analyzeRequest(ip: string, userAgent: string, endpoint: string): ScrapingAttempt {
  const attempt: ScrapingAttempt = {
    ip,
    userAgent,
    timestamp: new Date(),
    endpoint,
    suspicious: false,
  };

  // Check if AI bot
  if (detectAIBot(userAgent)) {
    attempt.suspicious = true;
    attempt.reason = 'AI bot detected';
    return attempt;
  }

  // Check if rate limited
  if (isRateLimited(ip)) {
    attempt.suspicious = true;
    attempt.reason = 'Rate limit exceeded';
    return attempt;
  }

  // Check if blocked
  if (isBlocked(ip)) {
    attempt.suspicious = true;
    attempt.reason = 'IP blocked';
    return attempt;
  }

  // Log request
  logRequest(ip);

  return attempt;
}

// Content fingerprinting for DMCA protection
export function generateContentFingerprint(content: string): string {
  // Simple hash function (use crypto in production)
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

// Watermark content with invisible markers
export function watermarkContent(content: string, userId: string): string {
  const watermark = `<!-- ${userId}-${Date.now()} -->`;
  return content + watermark;
}

// Detect if content has been scraped
export function detectScrapedContent(
  originalFingerprint: string,
  suspectedContent: string,
): boolean {
  const suspectedFingerprint = generateContentFingerprint(suspectedContent);
  return originalFingerprint === suspectedFingerprint;
}

// DMCA takedown automation
export interface DMCANotice {
  contentUrl: string;
  infringingUrl: string;
  description: string;
  contactEmail: string;
  timestamp: Date;
}

export async function submitDMCATakedown(notice: DMCANotice): Promise<boolean> {
  try {
    // In production, integrate with DMCA service providers

    // Send to legal team
    await fetch('/api/legal/dmca', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notice),
    });

    return true;
  } catch (error) {
    /* Error handled silently */
    // Error: $1
    return false;
  }
}

// Robots.txt enforcement
export const ROBOTS_TXT = `
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: Claude-Web
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Applebot-Extended
Disallow: /

User-agent: PerplexityBot
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: *
Disallow: /api/
Disallow: /admin/
Disallow: /student-portal/
Disallow: /instructor/
Allow: /
Crawl-delay: 10
`;

// Security headers for AI protection
export const SECURITY_HEADERS = {
  'X-Robots-Tag': 'noai, noimageai',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

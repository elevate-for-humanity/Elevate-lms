import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
// lib/notifySlack.ts
// Slack notifications utility for critical errors and events

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export type SlackSeverity = 'info' | 'warning' | 'error' | 'critical';

export async function notifySlack(
  message: string,
  opts?: {
    severity?: SlackSeverity;
    context?: Record<string, any>;
  },
): Promise<void> {
  if (!SLACK_WEBHOOK_URL) {
    return;
  }

  const severity = opts?.severity ?? 'info';

  // Map severity to emoji
  const emojiMap: Record<SlackSeverity, string> = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    critical: '🚨',
  };

  const emoji = emojiMap[severity];

  const blocks: any[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${emoji} *${severity.toUpperCase()}* – ${message}`,
      },
    },
  ];

  if (opts?.context) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '```' + JSON.stringify(opts.context, null, 2).slice(0, 2900) + '```',
      },
    });
  }

  // Add timestamp
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `<!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|${new Date().toISOString()}>`,
      },
    ],
  });

  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ blocks }),
    });
  } catch (error) {
    /* Error handled silently */
    // Error: $1
  }
}

/**
 * Notify Teams webhook (Microsoft Teams)
 */
export async function notifyTeams(
  message: string,
  opts?: {
    severity?: SlackSeverity;
    context?: Record<string, any>;
  },
): Promise<void> {
  const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;

  if (!TEAMS_WEBHOOK_URL) {
    return;
  }

  const severity = opts?.severity ?? 'info';

  // Teams message card format
  const card = {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    summary: message,
    themeColor: severity === 'critical' || severity === 'error' ? 'FF0000' : '0078D4',
    title: `${severity.toUpperCase()}: ${message}`,
    sections: [
      {
        activityTitle: PLATFORM_DEFAULTS.orgName,
        activitySubtitle: new Date().toISOString(),
        facts: opts?.context
          ? Object.entries(opts.context).map(([key, value]: any) => ({
              name: key,
              value: String(value),
            }))
          : [],
      },
    ],
  };

  try {
    await fetch(TEAMS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(card),
    });
  } catch (error) {
    /* Error handled silently */
    // Error: $1
  }
}

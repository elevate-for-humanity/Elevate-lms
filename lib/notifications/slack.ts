import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
// lib/notifications/slack.ts
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

type SlackField = {
  title: string;
  value: string;
  short?: boolean;
};

export async function sendSlackMessage(params: {
  text: string;
  fields?: SlackField[];
  color?: string;
}) {
  if (!SLACK_WEBHOOK_URL) {
    return;
  }

  const body = {
    text: params.text,
    attachments: [
      {
        color: params.color ?? '#FF6600',
        fields: (params.fields ?? []).map((f) => ({
          title: f.title,
          value: f.value,
          short: f.short ?? true,
        })),
        footer: PLATFORM_DEFAULTS.orgName,
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (error) {
    /* Error handled silently */
    // Error: $1
  }
}

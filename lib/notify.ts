const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;
const SENDGRID_KEY = process.env.SENDGRID_KEY;
const SENDGRID_FROM = process.env.SENDGRID_FROM;
const ALERT_EMAIL_TO = process.env.ALERT_EMAIL_TO;

export async function notifySlack(message: string) {
  if (!SLACK_WEBHOOK_URL) return;
  await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message }),
  });
}

export async function notifyTeams(message: string) {
  if (!TEAMS_WEBHOOK_URL) return;
  await fetch(TEAMS_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message }),
  });
}

export async function notifySendgrid(subject: string, text: string) {
  if (!SENDGRID_KEY || !SENDGRID_FROM || !ALERT_EMAIL_TO) return;

  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SENDGRID_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: ALERT_EMAIL_TO }] }],
      from: { email: SENDGRID_FROM, name: 'Elevate for Humanity Alerts' },
      subject,
      content: [{ type: 'text/plain', value: text }],
    }),
  });
}

export async function notifyCritical(message: string) {
  await Promise.all([
    notifySlack(`🚨 CRITICAL: ${message}`),
    notifyTeams(`🚨 CRITICAL: ${message}`),
    notifySendgrid('EFH Critical Alert', message),
  ]);
}

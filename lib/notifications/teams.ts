// lib/notifications/teams.ts
// Microsoft Teams webhook notifications
const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;
export async function sendTeamsMessage(title: string, text: string, context?: Record<string, any>) {
  if (!TEAMS_WEBHOOK_URL) {
    return;
  }
  const sections: any[] = [
    {
      activityTitle: title,
      text,
    },
  ];
  if (context) {
    sections.push({
      facts: Object.entries(context).map(([key, value]: any) => ({
        name: key,
        value: String(value),
      })),
    });
  }
  try {
    await fetch(TEAMS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        '@type': 'MessageCard',
        '@context': 'https://schema.org/extensions',
        summary: title,
        themeColor: 'FF6600',
        sections,
      }),
    });
    //
  } catch (error) {
    /* Error handled silently */
    // Error: $1
  }
}

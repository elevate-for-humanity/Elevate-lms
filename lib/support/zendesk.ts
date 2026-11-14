// lib/support/zendesk.ts
const ZENDESK_SUBDOMAIN = process.env.ZENDESK_SUBDOMAIN;
const ZENDESK_EMAIL = process.env.ZENDESK_EMAIL;
const ZENDESK_API_TOKEN = process.env.ZENDESK_API_TOKEN;

export async function createZendeskTicket(params: {
  requesterEmail: string;
  subject: string;
  body: string;
  tags?: string[];
}) {
  if (!ZENDESK_SUBDOMAIN || !ZENDESK_EMAIL || !ZENDESK_API_TOKEN) {
    return;
  }

  const auth = Buffer.from(`${ZENDESK_EMAIL}/token:${ZENDESK_API_TOKEN}`).toString('base64');

  const res = await fetch(`https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/requests.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      request: {
        requester: { email: params.requesterEmail },
        subject: params.subject,
        comment: { body: params.body },
        tags: params.tags ?? [],
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    // Error: $1
    throw new Error('Failed to create Zendesk ticket');
  }

  return res.json();
}

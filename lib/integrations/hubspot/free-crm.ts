import { logger } from '@/lib/logger';

const HUBSPOT_API_BASE = 'https://api.hubapi.com';
const HUBSPOT_CONTACT_UPSERT_PATH = '/crm/v3/objects/contacts/batch/upsert';
const REQUEST_TIMEOUT_MS = 8_000;

export type HubSpotFreeContact = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
};

export type HubSpotSyncResult =
  | { ok: true; skipped: false; contactId?: string }
  | { ok: true; skipped: true; reason: 'disabled' | 'not-configured' | 'missing-email' }
  | { ok: false; skipped: false; status?: number; error: string };

/**
 * HubSpot is intentionally a secondary CRM for Elevate.
 * Supabase remains the system of record.
 *
 * Free-tier guardrails:
 * - Contacts only in this adapter.
 * - No HubSpot workflows, campaigns, marketing email, subscriptions, invoices,
 *   quotes, products, or paid automation endpoints.
 * - One upsert request per application submission.
 * - CRM failure must never fail the application transaction.
 */
export function getHubSpotFreeCrmStatus() {
  const enabled = process.env.HUBSPOT_SYNC_ENABLED === 'true';
  const configured = Boolean(process.env.HUBSPOT_PRIVATE_APP_TOKEN?.trim());

  return {
    mode: 'free-tier-only' as const,
    enabled,
    configured,
    writableObjects: ['contacts'] as const,
    sourceOfTruth: 'supabase' as const,
  };
}

function clean(value: string | null | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export async function upsertHubSpotFreeContact(
  contact: HubSpotFreeContact,
): Promise<HubSpotSyncResult> {
  const status = getHubSpotFreeCrmStatus();

  if (!status.enabled) {
    return { ok: true, skipped: true, reason: 'disabled' };
  }

  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN?.trim();
  if (!token) {
    return { ok: true, skipped: true, reason: 'not-configured' };
  }

  const email = clean(contact.email)?.toLowerCase();
  if (!email) {
    return { ok: true, skipped: true, reason: 'missing-email' };
  }

  // Use only standard contact properties. This avoids requiring paid features or
  // custom HubSpot properties just to keep the CRM synchronized.
  const properties: Record<string, string> = {
    email,
    lifecyclestage: 'lead',
  };

  const optionalProperties: Record<string, string | undefined> = {
    firstname: clean(contact.firstName),
    lastname: clean(contact.lastName),
    phone: clean(contact.phone),
    city: clean(contact.city),
    state: clean(contact.state),
    zip: clean(contact.zip),
  };

  for (const [key, value] of Object.entries(optionalProperties)) {
    if (value !== undefined) properties[key] = value;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${HUBSPOT_API_BASE}${HUBSPOT_CONTACT_UPSERT_PATH}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: [
          {
            id: email,
            idProperty: 'email',
            properties,
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      const safeBody = body.slice(0, 500);
      logger.warn('[hubspot/free-crm] contact upsert failed', {
        status: response.status,
        body: safeBody,
      });
      return {
        ok: false,
        skipped: false,
        status: response.status,
        error: `HubSpot contact sync failed (${response.status})`,
      };
    }

    const payload = (await response.json().catch(() => null)) as
      | { results?: Array<{ id?: string }> }
      | null;

    return {
      ok: true,
      skipped: false,
      contactId: payload?.results?.[0]?.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn('[hubspot/free-crm] contact upsert unavailable', { error: message });
    return {
      ok: false,
      skipped: false,
      error: message,
    };
  } finally {
    clearTimeout(timer);
  }
}

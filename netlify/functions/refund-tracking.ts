/**
 * Netlify Function: Refund Tracking (Public)
 *
 * Reads from sfc_tax_return_public_status view using anon key.
 * No SSN, no service role key, no sensitive data.
 *
 * Endpoint: POST /.netlify/functions/refund-tracking
 * Redirect: POST /api/refund-tracking -> /.netlify/functions/refund-tracking (via netlify.toml)
 */

import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
};

// In-memory rate limiting (per function instance)
const ipLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60_000;
const FAILURE_DELAY_MS = 300;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = ipLimits.get(key);
  if (!entry || now > entry.resetTime) {
    ipLimits.set(key, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Generic not-found response (anti-enumeration)
function notFound() {
  return {
    statusCode: 404,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: "Not found" }),
  };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  // Rate limit by IP
  const clientIp =
    event.headers["x-nf-client-connection-ip"] ||
    (event.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    "unknown";

  if (!checkRateLimit(`ip:${clientIp}`)) {
    await delay(FAILURE_DELAY_MS);
    return {
      statusCode: 429,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Too many requests" }),
    };
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Server configuration error" }),
      };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const trackingCode = (body.tracking_code || "").trim();

    // Validate format (must start with SFC-)
    if (!trackingCode || !trackingCode.startsWith("SFC-")) {
      await delay(FAILURE_DELAY_MS);
      return notFound();
    }

    // Rate limit by tracking code
    if (!checkRateLimit(`code:${trackingCode}`)) {
      await delay(FAILURE_DELAY_MS);
      return {
        statusCode: 429,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Too many requests" }),
      };
    }

    // Use anon key — the view grants SELECT to anon
    const supabase = createClient(supabaseUrl, anonKey);

    const { data, error } = await supabase
      .from("sfc_tax_return_public_status")
      .select(
        "public_tracking_code, status, rejection_reason, created_at, updated_at, client_first_name, client_last_initial"
      )
      .eq("public_tracking_code", trackingCode)
      .maybeSingle();

    if (error || !data) {
      await delay(FAILURE_DELAY_MS);
      return notFound();
    }

    // Map status to user-friendly message
    const statusMessages: Record<string, string> = {
      received: "Your return has been received and is in our queue.",
      processing: "Your return is being reviewed by a tax professional.",
      submitted: "Your return has been submitted to the IRS.",
      accepted: "Your return has been accepted by the IRS.",
      action_required: "Your return needs attention. Please contact us.",
    };

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        status: data.status,
        statusMessage: statusMessages[data.status] || "Status update pending.",
        clientName: `${data.client_first_name || ""} ${data.client_last_initial || ""}`.trim(),
        rejectionReason: data.rejection_reason,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }),
    };
  } catch {
    await delay(FAILURE_DELAY_MS);
    return notFound();
  }
};

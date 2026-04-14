/**
 * Netlify Function: File Tax Return
 *
 * Creates a new sfc_tax_returns record in Supabase.
 * Uses service role key (server-side only, never exposed to client).
 *
 * Endpoint: POST /.netlify/functions/file-return
 * Redirect: POST /api/file-return -> /.netlify/functions/file-return (via netlify.toml)
 */

import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_ORIGINS = [
  "https://www.elevateforhumanity.org",
  "https://elevateforhumanity.org",
  "https://supersonicfastermoney.com",
  "https://www.supersonicfastermoney.com",
];

function getCorsHeaders(origin?: string) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  };
}

// Legacy constant for backwards compatibility
const CORS_HEADERS = getCorsHeaders();

export const handler: Handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin;
  const corsHeaders = getCorsHeaders(origin);

  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Server configuration error" }),
      };
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = event.body ? JSON.parse(event.body) : {};

    // Generate tracking ID if not provided
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 17);
    // Use randomBytes — Math.random() has collision risk for concurrent submissions.
    const { randomBytes } = require('crypto') as typeof import('crypto');
    const rand = randomBytes(4).toString('hex');
    const tracking_id = body.tracking_id || `SFC-${timestamp}-${rand}`;

    const insertPayload = {
      tracking_id,
      source_system: body.source_system || "netlify_function",
      source_submission_id: body.source_submission_id || null,
      client_first_name: body.client_first_name || null,
      client_last_name: body.client_last_name || null,
      client_email: body.client_email || null,
      filing_status: body.filing_status || null,
      tax_year: body.tax_year || new Date().getFullYear(),
      status: "received",
      payload: body.payload || null,
    };

    const { data, error } = await supabase
      .from("sfc_tax_returns")
      .insert(insertPayload)
      .select("tracking_id, status, created_at")
      .single();

    if (error) {
      console.error("Supabase insert error:", error.code);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Failed to create tax return" }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true, ...data }),
    };
  } catch (e) {
    console.error("file-return function error");
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

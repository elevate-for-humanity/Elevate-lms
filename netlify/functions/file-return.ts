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

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};

export const handler: Handler = async (event) => {
  // CORS preflight
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

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
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
    const rand = Math.random().toString(16).slice(2, 10);
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
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Failed to create tax return" }),
      };
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: true, ...data }),
    };
  } catch (e) {
    console.error("file-return function error");
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

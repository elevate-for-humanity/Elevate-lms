// REST API Core - Public API for Enterprise Integrations
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import * as crypto from 'node:crypto';

export interface APIKey {
  id: string;
  key: string;
  secret: string;
  userId: string;
  tenantId: string;
  scopes: string[];
  rateLimit: number;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp: string;
  };
}

// Verify API Key
export async function verifyAPIKey(apiKey: string, apiSecret: string): Promise<APIKey | null> {
  const supabase = await createClient();

  const { data: key } = await supabase
    .from('api_keys')
    .select('*')
    .eq('api_key', apiKey)
    .eq('is_active', true)
    .maybeSingle();

  if (!key) return null;

  // Verify secret
  const secretHash = crypto.createHash('sha256').update(apiSecret).digest('hex');
  if (key.api_secret !== secretHash) return null;

  // Check expiration
  if (key.expires_at && new Date(key.expires_at) < new Date()) {
    return null;
  }

  // Update last used
  await supabase
    .from('api_keys')
    .update({
      last_used_at: new Date().toISOString(),
      request_count: key.request_count + 1,
    })
    .eq('id', key.id);

  return {
    id: key.id,
    key: key.api_key,
    secret: key.api_secret,
    userId: key.user_id,
    tenantId: key.tenant_id,
    scopes: key.scopes || [],
    rateLimit: key.rate_limit || 1000,
  };
}

// Check Rate Limit
export async function checkRateLimit(apiKeyId: string, limit: number): Promise<boolean> {
  const supabase = await createClient();

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from('api_request_logs')
    .select('*', { count: 'exact', head: true })
    .eq('api_key_id', apiKeyId)
    .gte('created_at', oneHourAgo);

  return (count || 0) < limit;
}

// Log API Request
export async function logAPIRequest(
  apiKeyId: string,
  method: string,
  endpoint: string,
  statusCode: number,
  responseTime: number,
  ipAddress?: string,
  userAgent?: string,
  error?: string,
) {
  const supabase = await createClient();

  await supabase.from('api_request_logs').insert({
    api_key_id: apiKeyId,
    method,
    endpoint,
    status_code: statusCode,
    response_time_ms: responseTime,
    ip_address: ipAddress,
    user_agent: userAgent,
    error_message: error,
  });
}

// Check API Scope Permission
export function hasScope(apiKey: APIKey, requiredScope: string): boolean {
  return apiKey.scopes.includes('*') || apiKey.scopes.includes(requiredScope);
}

// Generate API Key
export async function generateAPIKey(
  userId: string,
  tenantId: string,
  keyName: string,
  scopes: string[],
  expiresInDays?: number,
): Promise<{ apiKey: string; apiSecret: string }> {
  const apiKey = `elk_${crypto.randomBytes(24).toString('hex')}`;
  const apiSecret = crypto.randomBytes(32).toString('hex');
  const secretHash = crypto.createHash('sha256').update(apiSecret).digest('hex');

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const supabase = await createClient();

  await supabase.from('api_keys').insert({
    user_id: userId,
    tenant_id: tenantId,
    key_name: keyName,
    api_key: apiKey,
    api_secret: secretHash,
    scopes,
    expires_at: expiresAt,
    created_by: userId,
  });

  return { apiKey, apiSecret };
}

// API Response Helper
export function apiResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  meta?: Record<string, any>,
): APIResponse<T> {
  return {
    success,
    data,
    error,
    meta: {
      ...meta,
      timestamp: new Date().toISOString(),
    },
  };
}

// Extract API Credentials from Request
export function extractAPICredentials(
  request: NextRequest,
): { apiKey: string; apiSecret: string } | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) return null;

  // Support both "Bearer" and "ApiKey" schemes
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const [apiKey, apiSecret] = token.split(':');
    return { apiKey, apiSecret };
  }

  if (authHeader.startsWith('ApiKey ')) {
    const token = authHeader.substring(7);
    const [apiKey, apiSecret] = token.split(':');
    return { apiKey, apiSecret };
  }

  return null;
}

// Middleware for API Authentication
export async function authenticateAPI(request: NextRequest): Promise<APIKey | null> {
  const credentials = extractAPICredentials(request);

  if (!credentials) return null;

  const apiKey = await verifyAPIKey(credentials.apiKey, credentials.apiSecret);

  if (!apiKey) return null;

  // Check rate limit
  const withinLimit = await checkRateLimit(apiKey.id, apiKey.rateLimit);

  if (!withinLimit) return null;

  return apiKey;
}

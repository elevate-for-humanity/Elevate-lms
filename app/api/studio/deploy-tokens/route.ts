import { logger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/admin';

import { NextRequest, NextResponse } from 'next/server';

import crypto from 'crypto';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

// Simple encryption for tokens - in production use a proper KMS
const ENCRYPTION_KEY = process.env.DEPLOY_TOKEN_KEY || 'default-key-change-in-production-32';
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Get deploy tokens for user
async function _GET(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const userId = req.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Missing user ID' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from('studio_deploy_tokens')
      .select('id, provider, project_id, created_at, updated_at')
      .eq('user_id', userId);

    if (error) throw error;

    // Return tokens without the actual token value (just indicate they exist)
    return NextResponse.json(
      (data || []).map(t => ({
        ...t,
        hasToken: true,
      }))
    );
  } catch (error) {
    logger.error('Deploy tokens GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deploy tokens' },
      { status: 500 }
    );
  }
}

// Save or update deploy token
async function _POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const userId = req.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Missing user ID' }, { status: 401 });
  }

  try {
    const { provider, token, project_id } = await req.json();

    if (!provider || !token) {
      return NextResponse.json(
        { error: 'Missing provider or token' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const encryptedToken = encrypt(token);

    const { data, error } = await supabase
      .from('studio_deploy_tokens')
      .upsert(
        {
          user_id: userId,
          provider,
          encrypted_token: encryptedToken,
          project_id: project_id || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,provider',
        }
      )
      .select('id, provider, project_id, created_at, updated_at')
      .single();

    if (error) throw error;

    return NextResponse.json({
      ...data,
      hasToken: true,
    });
  } catch (error) {
    logger.error('Deploy tokens POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save deploy token' },
      { status: 500 }
    );
  }
}

// Get decrypted token for deployment (internal use)
async function _PUT(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const userId = req.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Missing user ID' }, { status: 401 });
  }

  try {
    const { provider } = await req.json();

    if (!provider) {
      return NextResponse.json({ error: 'Missing provider' }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from('studio_deploy_tokens')
      .select('encrypted_token, project_id')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    const decryptedToken = decrypt(data.encrypted_token);

    return NextResponse.json({
      token: decryptedToken,
      project_id: data.project_id,
    });
  } catch (error) {
    logger.error('Deploy tokens PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to get deploy token' },
      { status: 500 }
    );
  }
}

// Delete deploy token
async function _DELETE(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const userId = req.headers.get('x-user-id');
  const provider = req.nextUrl.searchParams.get('provider');

  if (!userId) {
    return NextResponse.json({ error: 'Missing user ID' }, { status: 401 });
  }

  if (!provider) {
    return NextResponse.json({ error: 'Missing provider' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('studio_deploy_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('provider', provider);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error('Deploy tokens DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete deploy token' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/studio/deploy-tokens', _GET);
export const POST = withApiAudit('/api/studio/deploy-tokens', _POST);
export const PUT = withApiAudit('/api/studio/deploy-tokens', _PUT);
export const DELETE = withApiAudit('/api/studio/deploy-tokens', _DELETE);

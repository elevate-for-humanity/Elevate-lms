import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole, handleRBACError } from '@/lib/rbac';
import { withAuth } from '@/lib/with-auth';
import { logAdminAudit, AdminAction, BULK_ENTITY_ID } from '@/lib/admin/audit-log';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { applyRateLimit } from '@/lib/api/withRateLimit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

// GET /api/admin/sso - List SSO connections
const _GET = withAuth(
  async (req: NextRequest, context) => {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
    const user = context.user;
    try {
      await requireRole(['admin']);
      const supabase = await requireAdminClient();

      const { data, error }: any = await supabase
        .from('sso_providers')
        .select('id,tenant_id,provider_type,provider_name,issuer_url,authorization_url,token_url,userinfo_url,jwks_uri,scopes,attribute_mapping,is_active,created_at,updated_at')
        .order('provider_name');

      if (error) throw error;

      return NextResponse.json({ connections: data });
    } catch (err: any) {
      const { error, status } = handleRBACError(err);
      return NextResponse.json({ error }, { status });
    }
  },
  { roles: ['admin'] },
);

// POST /api/admin/sso - Create SSO connection
const _POST = withAuth(
  async (req: NextRequest, user) => {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;
    try {
      await requireRole(['admin']);
      const supabase = await requireAdminClient();
      const body = await req.json();

      const {
        provider,
        domain,
        display_name,
        saml_entity_id,
        saml_sso_url,
        saml_x509_cert,
        saml_sign_requests,
        oauth_client_id,
        oauth_client_secret,
        oauth_authorize_url,
        oauth_token_url,
        oauth_userinfo_url,
        oauth_scopes,
        mapping_rules,
        default_role,
        is_enabled,
        is_default,
      } = body;

      if (!provider || !display_name || !oauth_client_id) {
        return NextResponse.json(
          { error: 'provider, display_name, and oauth_client_id are required' },
          { status: 400 },
        );
      }

      const { data, error }: any = await supabase
        .from('sso_providers')
        .insert({
          provider_type: provider,
          provider_name: display_name,
          client_id: oauth_client_id,
          client_secret: oauth_client_secret,
          issuer_url: saml_entity_id,
          authorization_url: oauth_authorize_url || saml_sso_url,
          token_url: oauth_token_url,
          userinfo_url: oauth_userinfo_url,
          scopes: Array.isArray(oauth_scopes) ? oauth_scopes : typeof oauth_scopes === 'string' ? oauth_scopes.split(/[ ,]+/).filter(Boolean) : ['openid','email','profile'],
          attribute_mapping: { ...mapping_rules, domain, saml_x509_cert, saml_sign_requests, default_role, is_default },
          is_active: is_enabled === true,
        })
        .select('id,tenant_id,provider_type,provider_name,issuer_url,authorization_url,token_url,userinfo_url,jwks_uri,scopes,attribute_mapping,is_active,created_at,updated_at')
        .maybeSingle();

      if (error) throw error;

      await logAdminAudit({
        action: AdminAction.SSO_CONFIG_CREATED,
        actorId: user.user.id,
        entityType: 'sso_providers',
        entityId: data.id,
        metadata: { provider, domain },
        req,
      });

      return NextResponse.json({ connection: data }, { status: 201 });
    } catch (err: any) {
      const { error, status } = handleRBACError(err);
      return NextResponse.json({ error }, { status });
    }
  },
  { roles: ['admin'] },
);
export const GET = withApiAudit('/api/admin/sso', _GET);
export const POST = withApiAudit('/api/admin/sso', _POST);

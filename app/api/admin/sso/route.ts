export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole, handleRBACError } from '@/lib/rbac';
import { withAuth } from '@/lib/with-auth';
import { logAdminAudit, AdminAction, BULK_ENTITY_ID } from '@/lib/admin/audit-log';

// GET /api/admin/sso - List SSO connections
export const GET = withAuth(
  async (req, context) => {
    const user = context.user;
    try {
      await requireRole(['admin']);
      const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

      const { data, error }: any = await db
        .from('sso_connections')
        .select('*')
        .order('provider');

      if (error) throw error;

      return NextResponse.json({ connections: data });
    } catch (err: any) {
      const { error, status } = handleRBACError(err);
      return NextResponse.json({ error }, { status });
    }
  },
  { roles: ['admin', 'super_admin'] }
);

// POST /api/admin/sso - Create SSO connection
export const POST = withAuth(
  async (req: NextRequest, user) => {
    try {
      await requireRole(['admin']);
      const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
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

      if (!provider || !display_name) {
        return NextResponse.json(
          { error: 'provider and display_name are required' },
          { status: 400 }
        );
      }

      const { data, error }: any = await db
        .from('sso_connections')
        .insert({
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
        })
        .select('*')
        .single();

      if (error) throw error;

      await logAdminAudit({ action: AdminAction.SSO_CONFIG_CREATED, actorId: user.id, entityType: 'sso_connections', entityId: data.id, metadata: { provider, domain }, req });

      return NextResponse.json({ connection: data }, { status: 201 });
    } catch (err: any) {
      const { error, status } = handleRBACError(err);
      return NextResponse.json({ error }, { status });
    }
  },
  { roles: ['admin', 'super_admin'] }
);

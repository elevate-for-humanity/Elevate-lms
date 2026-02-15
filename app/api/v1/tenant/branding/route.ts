/**
 * Tenant Branding API
 * Allows license holders to customize their platform appearance
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateApiKey } from '@/lib/licensing';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';

interface BrandingSettings {
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  company_name?: string;
  tagline?: string;
  support_email?: string;
  support_phone?: string;
  custom_css?: string;
  custom_domain?: string;
  email_footer?: string;
}

// GET - Retrieve current branding settings
export async function GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const apiKey = request.headers.get('x-api-key');
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
  }

  const validation = await validateApiKey(apiKey);
  if (!validation.valid) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', validation.tenantId)
    .single();

  if (error || !tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  return NextResponse.json({
    tenant_id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    domain: tenant.domain,
    branding: {
      logo_url: tenant.logo_url,
      favicon_url: tenant.favicon_url,
      primary_color: tenant.primary_color || '#2563eb',
      secondary_color: tenant.secondary_color || '#1e40af',
      accent_color: tenant.accent_color || '#f97316',
      tagline: tenant.tagline,
      support_email: tenant.support_email,
      support_phone: tenant.support_phone,
      custom_css: tenant.custom_css,
      email_footer: tenant.email_footer,
    },
  });
}

// PATCH - Update branding settings
export async function PATCH(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const apiKey = request.headers.get('x-api-key');
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
  }

  const validation = await validateApiKey(apiKey);
  if (!validation.valid) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  // Check if white-label feature is enabled
  if (!validation.features?.includes('white_label')) {
    return NextResponse.json(
      { error: 'White-label branding not included in your license. Upgrade to Professional or Enterprise.' },
      { status: 403 }
    );
  }

  const body: BrandingSettings = await request.json();
  const supabase = await createClient();

  // Validate colors
  const colorRegex = /^#[0-9A-Fa-f]{6}$/;
  if (body.primary_color && !colorRegex.test(body.primary_color)) {
    return NextResponse.json({ error: 'Invalid primary_color format. Use hex (e.g., #2563eb)' }, { status: 400 });
  }
  if (body.secondary_color && !colorRegex.test(body.secondary_color)) {
    return NextResponse.json({ error: 'Invalid secondary_color format' }, { status: 400 });
  }
  if (body.accent_color && !colorRegex.test(body.accent_color)) {
    return NextResponse.json({ error: 'Invalid accent_color format' }, { status: 400 });
  }

  // Sanitize custom CSS (basic XSS prevention)
  if (body.custom_css) {
    body.custom_css = body.custom_css
      .replace(/<script/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/expression\(/gi, '')
      .substring(0, 10000); // Limit size
  }

  // Update tenant
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (body.logo_url !== undefined) updateData.logo_url = body.logo_url;
  if (body.favicon_url !== undefined) updateData.favicon_url = body.favicon_url;
  if (body.primary_color !== undefined) updateData.primary_color = body.primary_color;
  if (body.secondary_color !== undefined) updateData.secondary_color = body.secondary_color;
  if (body.accent_color !== undefined) updateData.accent_color = body.accent_color;
  if (body.company_name !== undefined) updateData.name = body.company_name;
  if (body.tagline !== undefined) updateData.tagline = body.tagline;
  if (body.support_email !== undefined) updateData.support_email = body.support_email;
  if (body.support_phone !== undefined) updateData.support_phone = body.support_phone;
  if (body.custom_css !== undefined) updateData.custom_css = body.custom_css;
  if (body.email_footer !== undefined) updateData.email_footer = body.email_footer;

  // Custom domain requires verification
  if (body.custom_domain !== undefined) {
    // Check if custom domain feature is enabled
    if (!validation.features?.includes('custom_domain')) {
      return NextResponse.json(
        { error: 'Custom domain not included in your license' },
        { status: 403 }
      );
    }
    updateData.domain = body.custom_domain;
    updateData.domain_verified = false; // Requires verification
  }

  const { error } = await supabase
    .from('tenants')
    .update(updateData)
    .eq('id', validation.tenantId);

  if (error) {
    return NextResponse.json({ error: 'Failed to update branding' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: 'Branding updated successfully',
    updated_fields: Object.keys(updateData).filter(k => k !== 'updated_at'),
  });
}

// POST - Upload logo/favicon (returns upload URL)
export async function POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const apiKey = request.headers.get('x-api-key');
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
  }

  const validation = await validateApiKey(apiKey);
  if (!validation.valid) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  if (!validation.features?.includes('white_label')) {
    return NextResponse.json(
      { error: 'White-label branding not included in your license' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { file_type, file_name } = body;

  if (!file_type || !['logo', 'favicon'].includes(file_type)) {
    return NextResponse.json({ error: 'file_type must be "logo" or "favicon"' }, { status: 400 });
  }

  const supabase = await createClient();
  const bucket = 'tenant-assets';
  const path = `${validation.tenantId}/${file_type}/${file_name || `${file_type}.png`}`;

  // Create signed upload URL
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error) {
    return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 });
  }

  return NextResponse.json({
    upload_url: data.signedUrl,
    path: data.path,
    token: data.token,
    instructions: 'PUT your file to upload_url with Content-Type header. Then call PATCH to update branding with the public URL.',
    public_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`,
  });
}

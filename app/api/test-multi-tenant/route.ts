import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { NextResponse } from 'next/server';

/**
 * Test Multi-Tenant Isolation
 * GET /api/test-multi-tenant
 */
export async function GET() {
  // Block in production — this endpoint is for development/testing only
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const results: any = {
      timestamp: new Date().toISOString(),
      tests: [],
    };

    // Test 1: Create test tenants
    const { data: tenant1, error: t1Error } = await supabase
      .from('tenants')
      .upsert({
        id: 'test-tenant-1',
        name: 'Test Organization 1',
        slug: 'test-org-1',
        domain: 'test1.example.com',
        primary_color: '#FF0000',
        secondary_color: '#00FF00',
        active: true,
      })
      .select()
      .single();

    results.tests.push({
      name: 'Create Tenant 1',
      passed: !t1Error,
      error: t1Error?.message,
      data: tenant1,
    });

    const { data: tenant2, error: t2Error } = await supabase
      .from('tenants')
      .upsert({
        id: 'test-tenant-2',
        name: 'Test Organization 2',
        slug: 'test-org-2',
        domain: 'test2.example.com',
        primary_color: '#0000FF',
        secondary_color: '#FFFF00',
        active: true,
      })
      .select()
      .single();

    results.tests.push({
      name: 'Create Tenant 2',
      passed: !t2Error,
      error: t2Error?.message,
      data: tenant2,
    });

    // Test 2: Create licenses
    const { data: license1, error: l1Error } = await supabase
      .from('licenses')
      .upsert({
        tenant_id: 'test-tenant-1',
        plan: 'professional',
        status: 'active',
        max_users: 50,
        max_programs: 10,
        max_students: 100,
        features: {
          ai_features: true,
          white_label: false,
          custom_domain: false,
          api_access: true,
          advanced_reporting: true,
          bulk_operations: true,
          sso: false,
          priority_support: true,
        },
      })
      .select()
      .single();

    results.tests.push({
      name: 'Create License 1 (Professional)',
      passed: !l1Error,
      error: l1Error?.message,
      data: license1,
    });

    const { data: license2, error: l2Error } = await supabase
      .from('licenses')
      .upsert({
        tenant_id: 'test-tenant-2',
        plan: 'enterprise',
        status: 'active',
        max_users: null,
        max_programs: null,
        max_students: null,
        features: {
          ai_features: true,
          white_label: true,
          custom_domain: true,
          api_access: true,
          advanced_reporting: true,
          bulk_operations: true,
          sso: true,
          priority_support: true,
        },
      })
      .select()
      .single();

    results.tests.push({
      name: 'Create License 2 (Enterprise)',
      passed: !l2Error,
      error: l2Error?.message,
      data: license2,
    });

    // Test 3: Test helper functions
    const { data: validLicense1 } = await supabase.rpc('is_license_valid', {
      p_tenant_id: 'test-tenant-1',
    });

    results.tests.push({
      name: 'License 1 Valid',
      passed: validLicense1 === true,
      data: { valid: validLicense1 },
    });

    const { data: validLicense2 } = await supabase.rpc('is_license_valid', {
      p_tenant_id: 'test-tenant-2',
    });

    results.tests.push({
      name: 'License 2 Valid',
      passed: validLicense2 === true,
      data: { valid: validLicense2 },
    });

    // Test 4: Test feature gating
    const { data: aiFeature1 } = await supabase.rpc('is_feature_enabled', {
      p_tenant_id: 'test-tenant-1',
      p_feature: 'ai_features',
    });

    results.tests.push({
      name: 'Tenant 1 - AI Features Enabled',
      passed: aiFeature1 === true,
      data: { enabled: aiFeature1 },
    });

    const { data: whiteLabel1 } = await supabase.rpc('is_feature_enabled', {
      p_tenant_id: 'test-tenant-1',
      p_feature: 'white_label',
    });

    results.tests.push({
      name: 'Tenant 1 - White Label Disabled',
      passed: whiteLabel1 === false,
      data: { enabled: whiteLabel1 },
    });

    const { data: whiteLabel2 } = await supabase.rpc('is_feature_enabled', {
      p_tenant_id: 'test-tenant-2',
      p_feature: 'white_label',
    });

    results.tests.push({
      name: 'Tenant 2 - White Label Enabled',
      passed: whiteLabel2 === true,
      data: { enabled: whiteLabel2 },
    });

    // Calculate summary
    const totalTests = results.tests.length;
    const passedTests = results.tests.filter((t: any) => t.passed).length;
    const failedTests = totalTests - passedTests;

    results.summary = {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      success_rate: ((passedTests / totalTests) * 100).toFixed(1) + '%',
      all_passed: failedTests === 0,
    };

    return NextResponse.json(results);
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}

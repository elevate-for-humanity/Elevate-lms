import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/automation/test/partner-approval
 * 
 * Test endpoint for partner approval automation.
 * Simulates partner checklist completion and approval flow.
 * 
 * FOR QA/DEMO PURPOSES ONLY.
 */
export async function POST() {
  const supabase = await createClient();

  // Check auth and admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const adminClient = createAdminClient();

  try {
    const testCases = [
      {
        name: 'Complete Partner - All Docs + MOU',
        hasAllDocs: true,
        hasMOU: true,
        licenseExpired: false,
        expectedOutcome: 'auto_approved',
      },
      {
        name: 'Missing MOU',
        hasAllDocs: true,
        hasMOU: false,
        licenseExpired: false,
        expectedOutcome: 'pending_requirements',
      },
      {
        name: 'Missing Documents',
        hasAllDocs: false,
        hasMOU: true,
        licenseExpired: false,
        expectedOutcome: 'pending_requirements',
      },
      {
        name: 'Expired License',
        hasAllDocs: true,
        hasMOU: true,
        licenseExpired: true,
        expectedOutcome: 'routed_to_review',
      },
    ];

    const results = [];

    for (const testCase of testCases) {
      // Create test partner
      const { data: partner, error: partnerError } = await adminClient
        .from('partners')
        .insert({
          name: `Test Partner - ${testCase.name}`,
          owner_name: 'Test Owner',
          email: `test-${Date.now()}@example.com`,
          phone: '555-0100',
          address_line1: '123 Test St',
          city: 'Indianapolis',
          state: 'IN',
          zip: '46201',
          license_number: `TEST-${Date.now()}`,
          license_state: 'IN',
          license_expiry: testCase.licenseExpired 
            ? '2023-01-01' 
            : '2026-12-31',
          apprentice_capacity: 5,
          status: 'pending',
          account_status: 'pending',
        })
        .select()
        .single();

      if (partnerError) {
        results.push({
          testCase: testCase.name,
          success: false,
          error: partnerError.message,
        });
        continue;
      }

      // Create documents if hasAllDocs
      if (testCase.hasAllDocs) {
        const docTypes = ['license', 'insurance', 'w9'];
        for (const docType of docTypes) {
          await adminClient.from('partner_documents').insert({
            partner_id: partner.id,
            document_type: docType,
            file_name: `${docType}_test.pdf`,
            file_url: 'https://example.com/test.pdf',
            status: 'verified',
            verified_at: new Date().toISOString(),
            verified_by: 'system',
          });
        }
      }

      // Create MOU if hasMOU
      if (testCase.hasMOU) {
        await adminClient.from('partner_mous').insert({
          partner_id: partner.id,
          version: '1.0',
          status: 'signed',
          signed_at: new Date().toISOString(),
          signed_by: 'Test Owner',
          expires_at: '2026-12-31',
        });
      }

      // Determine outcome
      let outcome: string;
      const blockers: string[] = [];

      if (!testCase.hasAllDocs) {
        outcome = 'pending_requirements';
        blockers.push('Missing required documents');
      } else if (!testCase.hasMOU) {
        outcome = 'pending_requirements';
        blockers.push('MOU not signed');
      } else if (testCase.licenseExpired) {
        outcome = 'routed_to_review';
        blockers.push('Professional license is expired');
      } else {
        outcome = 'auto_approved';
      }

      // Update partner status
      if (outcome === 'auto_approved') {
        await adminClient
          .from('partners')
          .update({
            status: 'active',
            account_status: 'active',
            approved_at: new Date().toISOString(),
          })
          .eq('id', partner.id);
      }

      // Record automated decision
      await adminClient.from('automated_decisions').insert({
        entity_type: 'partner',
        entity_id: partner.id,
        decision_type: 'partner_approval_test',
        outcome,
        actor: 'system',
        ruleset_version: '1.0.0-test',
        confidence_score: outcome === 'auto_approved' ? 1.0 : 0.5,
        reason_codes: outcome === 'auto_approved' 
          ? ['all_requirements_met', 'mou_signed', 'documents_verified']
          : blockers,
        input_snapshot: {
          test_case: testCase.name,
          has_all_docs: testCase.hasAllDocs,
          has_mou: testCase.hasMOU,
          license_expired: testCase.licenseExpired,
        },
        processing_time_ms: Math.floor(Math.random() * 300) + 50,
        created_at: new Date().toISOString(),
      });

      // Create review queue item if needed
      if (outcome === 'routed_to_review') {
        await adminClient.from('review_queue').insert({
          entity_type: 'partner',
          entity_id: partner.id,
          review_type: 'partner_approval',
          priority: 2,
          status: 'pending',
          failed_rules: blockers,
          system_recommendation: 'manual_review_required',
          created_at: new Date().toISOString(),
        });
      }

      results.push({
        testCase: testCase.name,
        success: true,
        partnerId: partner.id,
        expectedOutcome: testCase.expectedOutcome,
        actualOutcome: outcome,
        passed: outcome === testCase.expectedOutcome,
        blockers,
      });
    }

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => r.success && !r.passed).length;
    const errors = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      summary: {
        total: testCases.length,
        passed,
        failed,
        errors,
      },
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

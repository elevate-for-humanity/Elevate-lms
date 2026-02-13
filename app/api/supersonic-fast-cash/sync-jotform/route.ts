import { NextRequest, NextResponse } from 'next/server';
import { jotFormIntegration } from '@/lib/integrations/jotform';
import { drakeIntegration } from '@/lib/integrations/drake-software';
import { createClient } from '@supabase/supabase-js';
import { prepareSSNForStorage } from '@/lib/security/ssn';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface SyncJotformBody {
  formId?: string;
}

/**
 * Manually sync JotForm submissions
 */
export async function POST(request: NextRequest) {
  try {
    const body: SyncJotformBody = await request.json();
    const formId = body.formId || process.env.JOTFORM_FORM_ID;

    if (!formId) {
      return NextResponse.json(
        { error: 'Form ID required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get recent submissions from JotForm
    const submissions = await jotFormIntegration.getFormSubmissions(formId, 20);

    let syncedCount = 0;
    const errors: string[] = [];

    for (const submission of submissions) {
      try {
        // Check if already processed
        const { data: existing } = await supabase
          .from('clients')
          .select('id')
          .eq('jotform_submission_id', submission.id)
          .single();

        if (existing) {
          continue; // Skip already processed
        }

        // Parse submission
        const clientData = jotFormIntegration.parseSubmission(submission);

        // Securely hash SSN before storage
        const ssnData = clientData.ssn ? prepareSSNForStorage(clientData.ssn) : {};

        // Create client
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .insert({
            first_name: clientData.firstName,
            last_name: clientData.lastName,
            ...ssnData, // ssn_hash and ssn_last4 instead of plain SSN
            date_of_birth: clientData.dateOfBirth,
            email: clientData.email,
            phone: clientData.phone,
            address_street: clientData.address.street,
            address_city: clientData.address.city,
            address_state: clientData.address.state,
            address_zip: clientData.address.zip,
            filing_status: clientData.filingStatus,
            jotform_submission_id: submission.id,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (clientError) {
          errors.push(`Failed to create client for submission ${submission.id}`);
          continue;
        }

        // Create Drake return
        const drakeReturn = await drakeIntegration.createReturn({
          id: '',
          taxpayer: {
            firstName: clientData.firstName,
            lastName: clientData.lastName,
            ssn: clientData.ssn,
            dateOfBirth: clientData.dateOfBirth,
            address: {
              street: clientData.address.street,
              city: clientData.address.city,
              state: clientData.address.state,
              zip: clientData.address.zip,
            },
          },
          spouse: clientData.spouse,
          filingStatus: clientData.filingStatus,
          taxYear: new Date().getFullYear(),
          income: {
            w2: [],
            form1099: [],
          },
          deductions: {
            standard: true,
          },
          credits: {},
        });

        // Create tax return record
        await supabase.from('tax_returns').insert({
          user_id: client.id,
          tax_year: new Date().getFullYear(),
          filing_status: clientData.filingStatus,
          service_type: 'professional',
          status: 'in_progress',
          drake_return_id: drakeReturn.returnId,
          jotform_submission_id: submission.id,
          created_at: new Date().toISOString(),
        });

        syncedCount++;
      } catch (error) {
        errors.push(`Error processing submission ${submission.id}`);
      }
    }

    return NextResponse.json({
      success: true,
      count: syncedCount,
      total: submissions.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to sync submissions' },
      { status: 500 }
    );
  }
}

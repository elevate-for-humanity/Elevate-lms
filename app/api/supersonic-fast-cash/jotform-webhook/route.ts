import { NextRequest, NextResponse } from 'next/server';
import { jotFormIntegration } from '@/lib/integrations/jotform';
import { supersonicTaxEngine } from '@/lib/integrations/supersonic-tax';
import { supabaseServer } from '@/lib/supabaseServer';
import { Resend } from 'resend';
import { prepareSSNForStorage } from '@/lib/security/ssn';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * JotForm Webhook Handler
 * Receives form submissions and automatically creates SupersonicFastCash tax returns
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseServer();
    const body = await request.json();

    // Get submission ID from webhook
    const submissionId = body.submissionID || body.submission_id;

    if (!submissionId) {
      return NextResponse.json(
        { error: 'No submission ID provided' },
        { status: 400 }
      );
    }

    // Step 1: Fetch full submission data from JotForm
    const submission = await jotFormIntegration.getSubmission(submissionId);

    // Step 2: Parse submission into structured client data
    const clientData = jotFormIntegration.parseSubmission(submission);

    // Step 3: Create or update client in database
    // Securely hash SSN before storage
    const ssnData = clientData.ssn ? prepareSSNForStorage(clientData.ssn) : {};

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .upsert({
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
        jotform_submission_id: submissionId,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'email',
      })
      .select()
      .single();

    if (clientError) {
      throw new Error('Failed to save client data');
    }

    // Step 4: Create tax return in SupersonicFastCash Software
    const supersonicReturn = await supersonicTaxEngine.createReturn({
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

    // Step 5: Save tax return to database
    const { data: taxReturn, error: returnError } = await supabase
      .from('tax_returns')
      .insert({
        user_id: client.id,
        tax_year: new Date().getFullYear(),
        filing_status: clientData.filingStatus,
        service_type: 'professional',
        status: 'in_progress',
        supersonic_return_id: supersonicReturn.returnId,
        jotform_submission_id: submissionId,
        has_w2: clientData.hasW2,
        has_1099: clientData.has1099,
        has_self_employment: clientData.hasSelfEmployment,
        has_rental_income: clientData.hasRentalIncome,
        wants_refund_advance: clientData.wantsRefundAdvance,
        refund_method: clientData.refundMethod,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (returnError) {
      throw new Error('Failed to save tax return');
    }

    // Step 6: Save bank account info if provided
    if (clientData.bankAccount) {
      await supabase.from('bank_accounts').insert({
        client_id: client.id,
        routing_number: clientData.bankAccount.routingNumber,
        account_number: clientData.bankAccount.accountNumber,
        account_type: clientData.bankAccount.accountType,
        created_at: new Date().toISOString(),
      });
    }

    // Step 7: Save dependents
    if (clientData.dependents && clientData.dependents.length > 0) {
      const dependentsData = clientData.dependents.map((dep) => ({
        client_id: client.id,
        tax_return_id: taxReturn.id,
        first_name: dep.firstName,
        last_name: dep.lastName,
        ssn: dep.ssn,
        date_of_birth: dep.dateOfBirth,
        relationship: dep.relationship,
        created_at: new Date().toISOString(),
      }));

      await supabase.from('dependents').insert(dependentsData);
    }

    // Step 8: Send confirmation email to client
    try {
      await resend.emails.send({
        from: 'SupersonicFastCash <noreply@www.elevateforhumanity.org>',
        to: clientData.email,
        subject: 'Your Tax Return Information Received',
        html: `
          <h2>Thank You, ${clientData.firstName}!</h2>
          <p>We've received your tax information and created your account.</p>

          <h3>Next Steps:</h3>
          <ol>
            <li>Upload your tax documents (W-2s, 1099s, receipts)</li>
            <li>Schedule a video consultation with your tax pro</li>
            <li>Review and approve your return</li>
            <li>Get your refund!</li>
          </ol>

          <p><strong>Your Client ID:</strong> ${client.id}</p>
          <p><strong>SupersonicFastCash Return ID:</strong> ${supersonicReturn.returnId}</p>

          <p>
            <a href="https://www.elevateforhumanity.org/supersonic-fast-cash/portal"
               style="display: inline-block; padding: 12px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Access Your Portal
            </a>
          </p>

          ${clientData.wantsRefundAdvance ? `
            <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin-top: 20px;">
              <h3 style="margin: 0 0 8px 0;">💰 Refund Advance Available</h3>
              <p style="margin: 0;">You indicated interest in a refund advance. We'll contact you once your return is prepared to discuss options.</p>
            </div>
          ` : ''}

          <p>Questions? Call us at (317) 314-3757</p>

          <p>
            Best regards,<br>
            SupersonicFastCash Team
          </p>
        `,
      });
    } catch (emailError) {
      // Don't fail the webhook if email fails
    }

    // Step 9: Send notification to tax pro
    try {
      await resend.emails.send({
        from: 'SupersonicFastCash <noreply@www.elevateforhumanity.org>',
        to: 'supersonicfastcashllc@gmail.com',
        subject: `New Client: ${clientData.firstName} ${clientData.lastName}`,
        html: `
          <h2>New Client Intake</h2>

          <h3>Client Information:</h3>
          <ul>
            <li><strong>Name:</strong> ${clientData.firstName} ${clientData.lastName}</li>
            <li><strong>Email:</strong> ${clientData.email}</li>
            <li><strong>Phone:</strong> ${clientData.phone}</li>
            <li><strong>Filing Status:</strong> ${clientData.filingStatus}</li>
            <li><strong>Dependents:</strong> ${clientData.dependents.length}</li>
          </ul>

          <h3>Income Sources:</h3>
          <ul>
            <li>W-2: ${clientData.hasW2 ? 'Yes' : 'No'}</li>
            <li>1099: ${clientData.has1099 ? 'Yes' : 'No'}</li>
            <li>Self-Employment: ${clientData.hasSelfEmployment ? 'Yes' : 'No'}</li>
            <li>Rental Income: ${clientData.hasRentalIncome ? 'Yes' : 'No'}</li>
          </ul>

          <h3>SupersonicFastCash Software:</h3>
          <ul>
            <li><strong>Return ID:</strong> ${supersonicReturn.returnId}</li>
            <li><strong>Status:</strong> Created and ready for data entry</li>
          </ul>

          ${clientData.wantsRefundAdvance ? `
            <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin-top: 20px;">
              <h3 style="margin: 0 0 8px 0;">💰 Refund Advance Requested</h3>
              <p style="margin: 0;">Client wants a refund advance. Follow up after return is prepared.</p>
            </div>
          ` : ''}

          <p>
            <a href="https://www.elevateforhumanity.org/admin/tax-filing"
               style="display: inline-block; padding: 12px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
              View in Admin Dashboard
            </a>
          </p>
        `,
      });
    } catch (error) { /* Error handled silently */ }

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Client intake processed successfully',
      clientId: client.id,
      taxReturnId: taxReturn.id,
      supersonicReturnId: supersonicReturn.returnId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to process submission',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to test webhook
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'JotForm webhook endpoint is active',
    endpoint: '/api/supersonic-fast-cash/jotform-webhook',
    method: 'POST',
    description: 'Receives JotForm submissions and creates SupersonicFastCash tax returns',
  });
}

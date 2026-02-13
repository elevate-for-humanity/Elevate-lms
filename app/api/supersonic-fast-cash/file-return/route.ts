import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { drakeIntegration } from '@/lib/integrations/drake-software';
import { Resend } from 'resend';
import { prepareSSNForStorage } from '@/lib/security/ssn';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface W2Income {
  employerName: string;
  wages: number;
  federalWithholding: number;
}

interface Form1099Income {
  payerName: string;
  amount: number;
  type: string;
}

interface SelfEmploymentIncome {
  hasIncome: boolean;
  businessName?: string;
  grossReceipts?: number;
  expenses?: number;
}

interface ItemizedDeductions {
  mortgageInterest?: number;
  propertyTax?: number;
  charitableContributions?: number;
  medicalExpenses?: number;
  stateLocalTaxes?: number;
}

interface Dependent {
  firstName: string;
  lastName: string;
  ssn: string;
  relationship: string;
}

interface TaxReturnBody {
  firstName: string;
  lastName: string;
  ssn: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  filingStatus: string;
  spouseFirstName?: string;
  spouseLastName?: string;
  spouseSSN?: string;
  spouseDateOfBirth?: string;
  w2Income?: W2Income[];
  form1099Income?: Form1099Income[];
  selfEmploymentIncome?: SelfEmploymentIncome;
  deductionType: 'standard' | 'itemized';
  itemizedDeductions?: ItemizedDeductions;
  dependents?: Dependent[];
  hasChildTaxCredit?: boolean;
  hasEITC?: boolean;
  hasEducationCredits?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const taxReturn: TaxReturnBody = await request.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Securely hash SSN before storage
    const ssnData = prepareSSNForStorage(taxReturn.ssn);

    // Create client record
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        first_name: taxReturn.firstName,
        last_name: taxReturn.lastName,
        ...ssnData, // ssn_hash and ssn_last4 instead of plain SSN
        date_of_birth: taxReturn.dateOfBirth,
        email: taxReturn.email,
        phone: taxReturn.phone,
        address_street: taxReturn.address,
        address_city: taxReturn.city,
        address_state: taxReturn.state,
        address_zip: taxReturn.zip,
        filing_status: taxReturn.filingStatus,
      })
      .select()
      .single();

    if (clientError) {
      return NextResponse.json(
        { error: 'Failed to create client record' },
        { status: 500 }
      );
    }

    // Create Drake tax return
    const drakeReturn = await drakeIntegration.createReturn({
      id: client.id,
      taxpayer: {
        firstName: taxReturn.firstName,
        lastName: taxReturn.lastName,
        ssn: taxReturn.ssn,
        dateOfBirth: taxReturn.dateOfBirth,
        address: {
          street: taxReturn.address,
          city: taxReturn.city,
          state: taxReturn.state,
          zip: taxReturn.zip,
        },
      },
      spouse: taxReturn.filingStatus === 'married_joint' ? {
        firstName: taxReturn.spouseFirstName,
        lastName: taxReturn.spouseLastName,
        ssn: taxReturn.spouseSSN,
        dateOfBirth: taxReturn.spouseDateOfBirth,
      } : undefined,
      filingStatus: taxReturn.filingStatus as any,
      taxYear: 2024,
      income: {
        w2: taxReturn.w2Income || [],
        form1099: taxReturn.form1099Income || [],
        selfEmployment: taxReturn.selfEmploymentIncome?.hasIncome ? {
          businessName: taxReturn.selfEmploymentIncome.businessName,
          ein: '',
          grossReceipts: taxReturn.selfEmploymentIncome.grossReceipts,
          expenses: taxReturn.selfEmploymentIncome.expenses,
          netProfit: taxReturn.selfEmploymentIncome.grossReceipts - taxReturn.selfEmploymentIncome.expenses,
        } : undefined,
      },
      deductions: {
        standard: taxReturn.deductionType === 'standard',
        itemized: taxReturn.deductionType === 'itemized' ? taxReturn.itemizedDeductions : undefined,
      },
      credits: {
        childTaxCredit: taxReturn.hasChildTaxCredit ? (taxReturn.dependents?.length || 0) * 2000 : undefined,
        earnedIncomeCredit: taxReturn.hasEITC ? 3000 : undefined,
        educationCredits: taxReturn.hasEducationCredits ? 2500 : undefined,
      },
    });

    // Calculate tax
    const calculation = await drakeIntegration.calculateTax(drakeReturn.returnId);

    // Save tax return record
    const { data: taxReturnRecord, error: returnError } = await supabase
      .from('tax_returns')
      .insert({
        user_id: client.id,
        tax_year: 2024,
        filing_status: taxReturn.filingStatus,
        drake_return_id: drakeReturn.returnId,
        federal_refund: calculation.refundOrOwed,
        status: 'filed',
      })
      .select()
      .single();

    if (returnError) {
      /* Return record error handled silently */
    }

    // E-file the return
    const efileResult = await drakeIntegration.eFileReturn(drakeReturn.returnId);

    // Send confirmation email
    try {
      await resend.emails.send({
        from: 'SupersonicFastCash <noreply@supersonicfastcash.com>',
        to: taxReturn.email,
        subject: '✅ Tax Return Filed Successfully',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #16a34a 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .refund-box { background: white; border: 3px solid #16a34a; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
              .refund-amount { font-size: 48px; font-weight: bold; color: #16a34a; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Tax Return Filed!</h1>
                <p>Your 2024 tax return has been successfully filed with the IRS</p>
              </div>

              <div class="content">
                <h2>Hi ${taxReturn.firstName},</h2>
                <p>Great news! Your tax return has been filed electronically with the IRS.</p>

                <div class="refund-box">
                  <div style="font-size: 18px; margin-bottom: 10px;">Your Estimated Refund</div>
                  <div class="refund-amount">$${calculation.refundOrOwed.toLocaleString()}</div>
                </div>

                <h3>What Happens Next:</h3>
                <ol>
                  <li><strong>IRS Processing:</strong> The IRS will process your return within 21 days</li>
                  <li><strong>Refund Deposit:</strong> Your refund will be direct deposited to your bank account</li>
                  <li><strong>Track Status:</strong> You can track your refund at <a href="${process.env.NEXT_PUBLIC_SITE_URL}/supersonic-fast-cash/tools/refund-tracker">our refund tracker</a></li>
                </ol>

                <h3>Return Details:</h3>
                <ul>
                  <li><strong>Filing Status:</strong> ${taxReturn.filingStatus?.replace('_', ' ')}</li>
                  <li><strong>Tax Year:</strong> 2024</li>
                  <li><strong>Submission ID:</strong> ${efileResult.submissionId}</li>
                  <li><strong>Filed Date:</strong> ${new Date().toLocaleDateString()}</li>
                </ul>

                <p>You can view your complete tax return in your <a href="${process.env.NEXT_PUBLIC_SITE_URL}/supersonic-fast-cash/portal">client portal</a>.</p>

                <p>Questions? Reply to this email or call us at (317) (317) 314-3757.</p>

                <p>Thank you for choosing SupersonicFastCash!</p>
              </div>
            </div>
          </body>
          </html>
        `
      });
    } catch (error) { /* Error handled silently */ }

    return NextResponse.json({
      success: true,
      returnId: drakeReturn.returnId,
      submissionId: efileResult.submissionId,
      estimatedRefund: calculation.refundOrOwed,
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to file tax return' },
      { status: 500 }
    );
  }
}

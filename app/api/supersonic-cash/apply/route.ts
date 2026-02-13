
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toError, toErrorMessage } from '@/lib/safe';

/**
 * Supersonic Cash Advance Application API
 * Integrates with EOS Financial for underwriting
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const applicationData = await req.json();

    // Validate required fields
    const required = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'monthlyIncome',
      'bankName',
      'routingNumber',
      'accountNumber',
      'requestedAmount',
      'repaymentDate',
    ];
    for (const field of required) {
      if (!applicationData[field] && field !== 'monthlyIncome') {
        if (!applicationData.trainingStipend) {
          return NextResponse.json(
            { success: false, error: `Missing required field: ${field}` },
            { status: 400 }
          );
        }
      }
    }

    // Calculate total monthly income
    const totalIncome =
      parseInt(applicationData.monthlyIncome || '0', 10) +
      parseInt(applicationData.trainingStipend || '0', 10);

    // Basic underwriting rules (similar to H&R Block)
    const maxAdvance = calculateMaxAdvance(totalIncome);
    if (applicationData.requestedAmount > maxAdvance) {
      return NextResponse.json(
        {
          success: false,
          error: `Based on your income, maximum advance is $${maxAdvance}`,
        },
        { status: 400 }
      );
    }

    // Calculate fee
    const fee =
      applicationData.requestedAmount <= 1000
        ? 0
        : Math.round(applicationData.requestedAmount * 0.03);
    const totalRepayment = applicationData.requestedAmount + fee;

    // Create application in database
    const { data: application, error: dbError } = await supabase
      .from('cash_advance_applications')
      .insert({
        first_name: applicationData.firstName,
        last_name: applicationData.lastName,
        email: applicationData.email,
        phone: applicationData.phone,
        date_of_birth: applicationData.dateOfBirth,
        ssn_last4: applicationData.ssn,
        address: applicationData.address,
        city: applicationData.city,
        state: applicationData.state,
        zip_code: applicationData.zipCode,
        employment_status: applicationData.employmentStatus,
        employer: applicationData.employer,
        monthly_income: applicationData.monthlyIncome,
        training_stipend: applicationData.trainingStipend,
        total_income: totalIncome,
        bank_name: applicationData.bankName,
        account_type: applicationData.accountType,
        routing_number: applicationData.routingNumber,
        account_number: applicationData.accountNumber,
        requested_amount: applicationData.requestedAmount,
        fee_amount: fee,
        total_repayment: totalRepayment,
        purpose: applicationData.purpose,
        repayment_date: applicationData.repaymentDate,
        status: 'pending',
        application_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Send to EOS Financial for underwriting (if configured)
    if (process.env.EOS_FINANCIAL_API_KEY) {
      await sendToEOSFinancial(application);
    }

    // Auto-approve if meets criteria
    const autoApprove = shouldAutoApprove(
      totalIncome,
      applicationData.requestedAmount
    );

    if (autoApprove) {
      await supabase
        .from('cash_advance_applications')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_amount: applicationData.requestedAmount,
        })
        .eq('id', application.id);

      // Send approval email
      await sendApprovalEmail(applicationData.email, application);
    }

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      status: autoApprove ? 'approved' : 'pending',
      approvedAmount: autoApprove ? applicationData.requestedAmount : null,
      message: autoApprove
        ? 'Congratulations! Your application is approved. Funds will be deposited within 24 hours.'
        : "Your application is being reviewed. You'll hear from us within 1 hour.",
    });
  } catch (error) { /* Error handled silently */ 
    logger.error(
      'Cash advance application error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { success: false, error: toErrorMessage(error) || 'Application failed' },
      { status: 500 }
    );
  }
}

function calculateMaxAdvance(monthlyIncome: number): number {
  // Conservative underwriting: max 40% of monthly income
  // Similar to H&R Block's refund advance model
  if (monthlyIncome < 1000) return 0;
  if (monthlyIncome < 2000) return 500;
  if (monthlyIncome < 3000) return 1000;
  if (monthlyIncome < 4000) return 1500;
  if (monthlyIncome < 5000) return 2000;
  if (monthlyIncome < 6000) return 2500;
  if (monthlyIncome < 7000) return 3000;
  return 3500;
}

function shouldAutoApprove(
  monthlyIncome: number,
  requestedAmount: number
): boolean {
  // Auto-approve if:
  // 1. Income is at least 3x the requested amount
  // 2. Requested amount is under $1,000
  const incomeRatio = monthlyIncome / requestedAmount;
  return incomeRatio >= 3 || requestedAmount <= 1000;
}

async function sendToEOSFinancial(data: any) {
  // Integration with EOS Financial API
  // This would be configured with actual EOS Financial credentials
  try {
    const response = await fetch(process.env.EOS_FINANCIAL_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.EOS_FINANCIAL_API_KEY}`,
      },
      body: JSON.stringify({
        applicant: {
          firstName: application.first_name,
          lastName: application.last_name,
          email: application.email,
          phone: application.phone,
          ssn: application.ssn_last4,
        },
        loan: {
          amount: application.requested_amount,
          purpose: 'cash_advance',
          term: 'single_payment',
        },
        income: {
          monthly: application.total_income,
          source: application.employment_status,
        },
        banking: {
          routingNumber: application.routing_number,
          accountNumber: application.account_number,
          accountType: application.account_type,
        },
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    logger.error('EOS Financial API error:', error);
    // Don't fail the application if EOS is down
    return null;
  }
}

async function sendApprovalEmail(data: any) {
  // Send approval email via Resend
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: '✅ Your Supersonic Cash Advance is Approved!',
          html: `
          <h1>Congratulations! You're Approved!</h1>
          <p>Your Supersonic Cash Advance application has been approved.</p>
          <h2>Loan Details:</h2>
          <ul>
            <li>Advance Amount: $${application.requested_amount}</li>
            <li>Fee: $${application.fee_amount}</li>
            <li>Total Repayment: $${application.total_repayment}</li>
            <li>Repayment Date: ${application.repayment_date}</li>
          </ul>
          <p><strong>Funds will be deposited to your bank account within 24 hours.</strong></p>
          <p>Questions? Call us at (317) 314-3757</p>
        `,
        }),
      }
    );
  } catch (error) {
    logger.error('Email send error:', error);
  }
}

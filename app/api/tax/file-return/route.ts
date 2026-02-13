/**
 * Direct IRS E-File API
 * Replaces Drake Software integration
 * EFIN: 358459
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createMeFSubmission, generateMeFXML } from '@/lib/tax-software/mef/xml-generator';
import { createTransmitter } from '@/lib/tax-software/mef/transmission';
import { createAcknowledgmentHandler } from '@/lib/tax-software/mef/acknowledgment';
import { TaxReturn } from '@/lib/tax-software/types';
import { prepareSSNForStorage } from '@/lib/security/ssn';
import { Resend } from 'resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Software ID - will be assigned by IRS after approval
const SOFTWARE_ID = process.env.IRS_SOFTWARE_ID || 'PENDING_APPROVAL';
const EFIN = '358459';

export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const body = await request.json();
    
    // Build TaxReturn object from request
    const taxReturn: TaxReturn = {
      taxYear: body.taxYear || 2024,
      efin: EFIN,
      softwareId: SOFTWARE_ID,
      returnId: `${EFIN}-${Date.now()}`,
      
      taxpayer: {
        firstName: body.firstName,
        middleInitial: body.middleInitial,
        lastName: body.lastName,
        ssn: body.ssn,
        dateOfBirth: body.dateOfBirth,
        occupation: body.occupation,
        phone: body.phone,
        email: body.email
      },
      
      address: {
        street: body.address,
        apartment: body.apartment,
        city: body.city,
        state: body.state,
        zip: body.zip
      },
      
      filingStatus: body.filingStatus,
      
      spouse: body.filingStatus === 'married_filing_jointly' && body.spouseFirstName ? {
        firstName: body.spouseFirstName,
        lastName: body.spouseLastName,
        ssn: body.spouseSSN,
        dateOfBirth: body.spouseDateOfBirth
      } : undefined,
      
      dependents: (body.dependents || []).map((dep: any) => ({
        firstName: dep.firstName,
        lastName: dep.lastName,
        ssn: dep.ssn,
        relationship: dep.relationship,
        dateOfBirth: dep.dateOfBirth,
        monthsLivedWithYou: dep.monthsLivedWithYou || 12,
        childTaxCredit: dep.childTaxCredit || false,
        otherDependentCredit: dep.otherDependentCredit || false
      })),
      
      w2Income: (body.w2Income || []).map((w2: any) => ({
        employerEIN: w2.ein || w2.employerEIN,
        employerName: w2.employer || w2.employerName,
        employerAddress: {
          street: w2.employerAddress?.street || '',
          city: w2.employerAddress?.city || '',
          state: w2.employerAddress?.state || body.state,
          zip: w2.employerAddress?.zip || ''
        },
        wages: w2.wages || 0,
        federalWithholding: w2.federalWithholding || 0,
        socialSecurityWages: w2.socialSecurityWages || w2.wages || 0,
        socialSecurityTax: w2.socialSecurityTax || 0,
        medicareWages: w2.medicareWages || w2.wages || 0,
        medicareTax: w2.medicareTax || 0,
        stateWages: w2.stateWages,
        stateWithholding: w2.stateWithholding,
        stateCode: w2.stateCode || body.state
      })),
      
      form1099INT: body.form1099Income?.filter((f: any) => f.type === 'INT'),
      form1099DIV: body.form1099Income?.filter((f: any) => f.type === 'DIV'),
      form1099MISC: body.form1099Income?.filter((f: any) => f.type === 'MISC'),
      form1099NEC: body.form1099Income?.filter((f: any) => f.type === 'NEC'),
      
      scheduleCBusiness: body.selfEmploymentIncome?.hasIncome ? [{
        businessName: body.selfEmploymentIncome.businessName || 'Self-Employment',
        businessCode: body.selfEmploymentIncome.businessCode || '999999',
        accountingMethod: 'cash',
        grossReceipts: body.selfEmploymentIncome.grossReceipts || 0,
        grossProfit: body.selfEmploymentIncome.grossReceipts || 0,
        expenses: {
          otherExpenses: body.selfEmploymentIncome.expenses || 0
        },
        netProfit: (body.selfEmploymentIncome.grossReceipts || 0) - (body.selfEmploymentIncome.expenses || 0)
      }] : undefined,
      
      deductionType: body.deductionType || 'standard',
      
      itemizedDeductions: body.deductionType === 'itemized' ? {
        medicalExpenses: body.itemizedDeductions?.medicalExpenses || 0,
        stateLocalTaxes: body.itemizedDeductions?.stateLocalTaxes || 0,
        realEstateTaxes: body.itemizedDeductions?.propertyTax || 0,
        personalPropertyTaxes: 0,
        mortgageInterest: body.itemizedDeductions?.mortgageInterest || 0,
        charitableCash: body.itemizedDeductions?.charitableContributions || 0
      } : undefined,
      
      // These will be calculated
      totalIncome: 0,
      adjustedGrossIncome: 0,
      taxableIncome: 0,
      taxBeforeCredits: 0,
      credits: {
        childTaxCredit: 0,
        creditForOtherDependents: 0,
        earnedIncomeCredit: 0,
        additionalChildTaxCredit: 0
      },
      totalCredits: 0,
      federalWithholding: 0,
      totalTax: 0,
      totalPayments: 0,
      
      directDeposit: body.bankAccount ? {
        routingNumber: body.bankAccount.routingNumber,
        accountNumber: body.bankAccount.accountNumber,
        accountType: body.bankAccount.accountType
      } : undefined,
      
      taxpayerSignature: {
        pin: body.pin || body.taxpayerPin,
        signedDate: new Date().toISOString().split('T')[0]
      }
    };
    
    // Calculate tax
    const calculation = calculateTax(taxReturn);
    taxReturn.totalIncome = calculation.totalIncome;
    taxReturn.adjustedGrossIncome = calculation.agi;
    taxReturn.taxableIncome = calculation.taxableIncome;
    taxReturn.taxBeforeCredits = calculation.taxBeforeCredits;
    taxReturn.credits = calculation.credits;
    taxReturn.totalCredits = calculation.totalCredits;
    taxReturn.federalWithholding = calculation.federalWithholding;
    taxReturn.totalTax = calculation.totalTax;
    taxReturn.totalPayments = calculation.totalPayments;
    taxReturn.refundAmount = calculation.refund > 0 ? calculation.refund : undefined;
    taxReturn.amountOwed = calculation.owed > 0 ? calculation.owed : undefined;
    
    // Hash SSN for storage
    const ssnData = prepareSSNForStorage(body.ssn);
    
    // Create client record
    const { data: client, error: clientError } = await supabase
      .from('tax_clients')
      .upsert({
        first_name: body.firstName,
        last_name: body.lastName,
        ssn_hash: ssnData.ssn_hash,
        ssn_last4: ssnData.ssn_last4,
        date_of_birth: body.dateOfBirth,
        email: body.email,
        phone: body.phone,
        address_street: body.address,
        address_city: body.city,
        address_state: body.state,
        address_zip: body.zip,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'ssn_hash'
      })
      .select()
      .single();
    
    if (clientError) {
      console.error('Client creation error:', clientError);
    }
    
    // Create MeF submission
    const submission = createMeFSubmission(taxReturn, SOFTWARE_ID);
    
    // Store submission in database
    const { error: submissionError } = await supabase
      .from('mef_submissions')
      .insert({
        submission_id: submission.submissionId,
        user_id: client?.user_id,
        efin: EFIN,
        software_id: SOFTWARE_ID,
        tax_year: taxReturn.taxYear,
        submission_type: 'IRS1040',
        taxpayer_ssn_hash: ssnData.ssn_hash,
        taxpayer_name: `${body.firstName} ${body.lastName}`,
        return_data: taxReturn,
        xml_content: submission.xmlContent,
        status: 'pending'
      });
    
    if (submissionError) {
      console.error('Submission storage error:', submissionError);
    }
    
    // Create tax return record
    const { data: taxReturnRecord, error: returnError } = await supabase
      .from('tax_returns')
      .insert({
        user_id: client?.user_id,
        client_id: client?.id,
        submission_id: submission.submissionId,
        tax_year: taxReturn.taxYear,
        filing_status: taxReturn.filingStatus,
        total_income: taxReturn.totalIncome,
        adjusted_gross_income: taxReturn.adjustedGrossIncome,
        taxable_income: taxReturn.taxableIncome,
        total_tax: taxReturn.totalTax,
        total_payments: taxReturn.totalPayments,
        refund_amount: taxReturn.refundAmount,
        amount_owed: taxReturn.amountOwed,
        status: 'pending'
      })
      .select()
      .single();
    
    // Store W2 income
    if (taxReturn.w2Income && taxReturn.w2Income.length > 0) {
      for (const w2 of taxReturn.w2Income) {
        await supabase.from('tax_w2_income').insert({
          tax_return_id: taxReturnRecord?.id,
          employer_ein: w2.employerEIN,
          employer_name: w2.employerName,
          employer_address_street: w2.employerAddress.street,
          employer_address_city: w2.employerAddress.city,
          employer_address_state: w2.employerAddress.state,
          employer_address_zip: w2.employerAddress.zip,
          wages: w2.wages,
          federal_withholding: w2.federalWithholding,
          social_security_wages: w2.socialSecurityWages,
          social_security_tax: w2.socialSecurityTax,
          medicare_wages: w2.medicareWages,
          medicare_tax: w2.medicareTax,
          state_wages: w2.stateWages,
          state_withholding: w2.stateWithholding,
          state_code: w2.stateCode
        });
      }
    }
    
    // Store dependents
    if (taxReturn.dependents && taxReturn.dependents.length > 0) {
      for (const dep of taxReturn.dependents) {
        const depSsn = prepareSSNForStorage(dep.ssn);
        await supabase.from('tax_dependents').insert({
          tax_return_id: taxReturnRecord?.id,
          client_id: client?.id,
          first_name: dep.firstName,
          last_name: dep.lastName,
          ssn_hash: depSsn.ssn_hash,
          ssn_last4: depSsn.ssn_last4,
          date_of_birth: dep.dateOfBirth,
          relationship: dep.relationship,
          months_lived_with_taxpayer: dep.monthsLivedWithYou,
          child_tax_credit_eligible: dep.childTaxCredit,
          other_dependent_credit_eligible: dep.otherDependentCredit
        });
      }
    }
    
    // Transmit to IRS (when Software ID is approved)
    let transmissionResult = null;
    if (SOFTWARE_ID !== 'PENDING_APPROVAL') {
      const transmitter = createTransmitter({
        softwareId: SOFTWARE_ID,
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'test'
      });
      
      transmissionResult = await transmitter.transmit(submission);
      
      // Update status based on transmission result
      await supabase
        .from('tax_returns')
        .update({
          status: transmissionResult.success ? 'transmitted' : 'transmission_failed',
          filed_at: transmissionResult.success ? new Date().toISOString() : null
        })
        .eq('id', taxReturnRecord?.id);
    }
    
    // Send confirmation email
    if (resend && body.email) {
      try {
        await resend.emails.send({
          from: 'Supersonic Fast Cash <noreply@supersonicfastcash.com>',
          to: body.email,
          subject: `Tax Return ${SOFTWARE_ID === 'PENDING_APPROVAL' ? 'Prepared' : 'Filed'} - ${taxReturn.taxYear}`,
          html: generateConfirmationEmail(taxReturn, submission.submissionId, calculation)
        });
      } catch (emailError) {
        console.error('Email error:', emailError);
      }
    }
    
    return NextResponse.json({
      success: true,
      submissionId: submission.submissionId,
      returnId: taxReturnRecord?.id,
      taxYear: taxReturn.taxYear,
      filingStatus: taxReturn.filingStatus,
      totalIncome: taxReturn.totalIncome,
      adjustedGrossIncome: taxReturn.adjustedGrossIncome,
      taxableIncome: taxReturn.taxableIncome,
      totalTax: taxReturn.totalTax,
      totalPayments: taxReturn.totalPayments,
      refundAmount: taxReturn.refundAmount,
      amountOwed: taxReturn.amountOwed,
      status: SOFTWARE_ID === 'PENDING_APPROVAL' ? 'pending_software_approval' : 
              transmissionResult?.success ? 'transmitted' : 'pending',
      message: SOFTWARE_ID === 'PENDING_APPROVAL' 
        ? 'Return prepared and saved. Will be transmitted once IRS Software ID is approved.'
        : transmissionResult?.success 
          ? 'Return successfully transmitted to IRS.'
          : 'Return saved. Transmission pending.'
    });
    
  } catch (error: any) {
    console.error('Tax filing error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process tax return' },
      { status: 500 }
    );
  }
}

function calculateTax(taxReturn: TaxReturn) {
  // Calculate total income
  const w2Wages = taxReturn.w2Income?.reduce((sum, w2) => sum + (w2.wages || 0), 0) || 0;
  const interestIncome = taxReturn.form1099INT?.reduce((sum, f) => sum + (f.interestIncome || 0), 0) || 0;
  const dividendIncome = taxReturn.form1099DIV?.reduce((sum, f) => sum + (f.ordinaryDividends || 0), 0) || 0;
  const businessIncome = taxReturn.scheduleCBusiness?.reduce((sum, b) => sum + (b.netProfit || 0), 0) || 0;
  
  const totalIncome = w2Wages + interestIncome + dividendIncome + businessIncome;
  
  // Calculate adjustments
  const adjustments = taxReturn.adjustments ? (
    (taxReturn.adjustments.educatorExpenses || 0) +
    (taxReturn.adjustments.hsaDeduction || 0) +
    (taxReturn.adjustments.selfEmploymentTax || 0) +
    (taxReturn.adjustments.selfEmployedHealthInsurance || 0) +
    (taxReturn.adjustments.iraDeduction || 0) +
    (taxReturn.adjustments.studentLoanInterest || 0)
  ) : 0;
  
  const agi = totalIncome - adjustments;
  
  // Calculate deduction
  let deduction = 0;
  if (taxReturn.deductionType === 'standard') {
    const standardDeductions: Record<string, number> = {
      'single': 14600,
      'married_filing_jointly': 29200,
      'married_filing_separately': 14600,
      'head_of_household': 21900,
      'qualifying_surviving_spouse': 29200
    };
    deduction = standardDeductions[taxReturn.filingStatus] || 14600;
  } else if (taxReturn.itemizedDeductions) {
    const d = taxReturn.itemizedDeductions;
    const saltCap = Math.min(
      (d.stateLocalTaxes || 0) + (d.realEstateTaxes || 0) + (d.personalPropertyTaxes || 0),
      10000
    );
    deduction = (d.medicalExpenses || 0) + saltCap + (d.mortgageInterest || 0) + 
                (d.charitableCash || 0) + (d.charitableNoncash || 0);
  }
  
  const taxableIncome = Math.max(0, agi - deduction - (taxReturn.qualifiedBusinessIncomeDeduction || 0));
  
  // Calculate tax using 2024 brackets
  let taxBeforeCredits = 0;
  if (taxReturn.filingStatus === 'single' || taxReturn.filingStatus === 'married_filing_separately') {
    if (taxableIncome <= 11600) taxBeforeCredits = taxableIncome * 0.10;
    else if (taxableIncome <= 47150) taxBeforeCredits = 1160 + (taxableIncome - 11600) * 0.12;
    else if (taxableIncome <= 100525) taxBeforeCredits = 5426 + (taxableIncome - 47150) * 0.22;
    else if (taxableIncome <= 191950) taxBeforeCredits = 17168.50 + (taxableIncome - 100525) * 0.24;
    else if (taxableIncome <= 243725) taxBeforeCredits = 39110.50 + (taxableIncome - 191950) * 0.32;
    else if (taxableIncome <= 609350) taxBeforeCredits = 55678.50 + (taxableIncome - 243725) * 0.35;
    else taxBeforeCredits = 183647.25 + (taxableIncome - 609350) * 0.37;
  } else if (taxReturn.filingStatus === 'married_filing_jointly' || taxReturn.filingStatus === 'qualifying_surviving_spouse') {
    if (taxableIncome <= 23200) taxBeforeCredits = taxableIncome * 0.10;
    else if (taxableIncome <= 94300) taxBeforeCredits = 2320 + (taxableIncome - 23200) * 0.12;
    else if (taxableIncome <= 201050) taxBeforeCredits = 10852 + (taxableIncome - 94300) * 0.22;
    else if (taxableIncome <= 383900) taxBeforeCredits = 34337 + (taxableIncome - 201050) * 0.24;
    else if (taxableIncome <= 487450) taxBeforeCredits = 78221 + (taxableIncome - 383900) * 0.32;
    else if (taxableIncome <= 731200) taxBeforeCredits = 111357 + (taxableIncome - 487450) * 0.35;
    else taxBeforeCredits = 196669.50 + (taxableIncome - 731200) * 0.37;
  } else if (taxReturn.filingStatus === 'head_of_household') {
    if (taxableIncome <= 16550) taxBeforeCredits = taxableIncome * 0.10;
    else if (taxableIncome <= 63100) taxBeforeCredits = 1655 + (taxableIncome - 16550) * 0.12;
    else if (taxableIncome <= 100500) taxBeforeCredits = 7241 + (taxableIncome - 63100) * 0.22;
    else if (taxableIncome <= 191950) taxBeforeCredits = 15469 + (taxableIncome - 100500) * 0.24;
    else if (taxableIncome <= 243700) taxBeforeCredits = 37417 + (taxableIncome - 191950) * 0.32;
    else if (taxableIncome <= 609350) taxBeforeCredits = 53977 + (taxableIncome - 243700) * 0.35;
    else taxBeforeCredits = 181954.50 + (taxableIncome - 609350) * 0.37;
  }
  
  // Calculate credits
  const numDependentsForCTC = taxReturn.dependents?.filter(d => d.childTaxCredit).length || 0;
  const numDependentsForODC = taxReturn.dependents?.filter(d => d.otherDependentCredit).length || 0;
  
  const childTaxCredit = Math.min(numDependentsForCTC * 2000, taxBeforeCredits);
  const creditForOtherDependents = Math.min(numDependentsForODC * 500, taxBeforeCredits - childTaxCredit);
  
  // EITC calculation (simplified)
  let earnedIncomeCredit = 0;
  const numChildren = taxReturn.dependents?.length || 0;
  if (taxReturn.filingStatus !== 'married_filing_separately') {
    if (numChildren === 0 && agi < 17640) earnedIncomeCredit = Math.min(600, w2Wages * 0.0765);
    else if (numChildren === 1 && agi < 46560) earnedIncomeCredit = Math.min(3995, w2Wages * 0.34);
    else if (numChildren === 2 && agi < 52918) earnedIncomeCredit = Math.min(6604, w2Wages * 0.40);
    else if (numChildren >= 3 && agi < 56838) earnedIncomeCredit = Math.min(7430, w2Wages * 0.45);
  }
  
  // Additional Child Tax Credit (refundable portion)
  const additionalChildTaxCredit = Math.max(0, (numDependentsForCTC * 2000) - childTaxCredit);
  
  const credits = {
    childTaxCredit,
    creditForOtherDependents,
    earnedIncomeCredit,
    additionalChildTaxCredit
  };
  
  const totalCredits = childTaxCredit + creditForOtherDependents;
  const totalTax = Math.max(0, taxBeforeCredits - totalCredits);
  
  // Calculate payments
  const federalWithholding = taxReturn.w2Income?.reduce((sum, w2) => sum + (w2.federalWithholding || 0), 0) || 0;
  const estimatedPayments = taxReturn.estimatedTaxPayments || 0;
  const refundableCredits = earnedIncomeCredit + additionalChildTaxCredit;
  const totalPayments = federalWithholding + estimatedPayments + refundableCredits;
  
  const refund = totalPayments - totalTax;
  const owed = totalTax - totalPayments;
  
  return {
    totalIncome,
    agi,
    taxableIncome,
    taxBeforeCredits,
    credits,
    totalCredits,
    federalWithholding,
    totalTax,
    totalPayments,
    refund: refund > 0 ? refund : 0,
    owed: owed > 0 ? owed : 0
  };
}

function generateConfirmationEmail(taxReturn: TaxReturn, submissionId: string, calculation: any): string {
  const refundOrOwed = calculation.refund > 0 
    ? `<div style="color: #16a34a; font-size: 36px; font-weight: bold;">Refund: $${calculation.refund.toLocaleString()}</div>`
    : `<div style="color: #dc2626; font-size: 36px; font-weight: bold;">Amount Owed: $${calculation.owed.toLocaleString()}</div>`;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .summary { background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Tax Return Confirmation</h1>
      <p>Tax Year ${taxReturn.taxYear}</p>
    </div>
    <div class="content">
      <h2>Hello ${taxReturn.taxpayer.firstName},</h2>
      <p>Your tax return has been prepared and saved.</p>
      
      <div class="summary">
        <h3>Return Summary</h3>
        <div class="row"><span>Filing Status:</span><span>${taxReturn.filingStatus.replace(/_/g, ' ')}</span></div>
        <div class="row"><span>Total Income:</span><span>$${calculation.totalIncome.toLocaleString()}</span></div>
        <div class="row"><span>Adjusted Gross Income:</span><span>$${calculation.agi.toLocaleString()}</span></div>
        <div class="row"><span>Taxable Income:</span><span>$${calculation.taxableIncome.toLocaleString()}</span></div>
        <div class="row"><span>Total Tax:</span><span>$${calculation.totalTax.toLocaleString()}</span></div>
        <div class="row"><span>Total Payments:</span><span>$${calculation.totalPayments.toLocaleString()}</span></div>
        <div style="text-align: center; padding: 20px 0;">
          ${refundOrOwed}
        </div>
      </div>
      
      <p><strong>Submission ID:</strong> ${submissionId}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      
      <p>Questions? Contact us at (317) 314-3757 or reply to this email.</p>
      
      <p>Thank you for choosing Supersonic Fast Cash!</p>
    </div>
  </div>
</body>
</html>
  `;
}

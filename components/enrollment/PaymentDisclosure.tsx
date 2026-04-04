'use client';

import { useState } from 'react';
import { AlertCircle, FileText } from 'lucide-react';
import { TIER3_INTERNAL_PLAN, REFUND_POLICY } from '@/lib/stripe/tuition-config';

interface PaymentDisclosureProps {
  programName: string;
  tuitionAmount: number;
  depositAmount: number;
  monthlyPayment: number;
  numberOfMonths: number;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * PAYMENT DISCLOSURE COMPONENT
 * 
 * Required for all internal payment plan enrollments.
 * Student must acknowledge all terms before proceeding.
 * This creates a legally defensible record of disclosure.
 */
export function PaymentDisclosure({
  programName,
  tuitionAmount,
  depositAmount,
  monthlyPayment,
  numberOfMonths,
  onAccept,
  onDecline,
}: PaymentDisclosureProps) {
  const [acknowledged, setAcknowledged] = useState({
    totalCost: false,
    autopayRequired: false,
    missedPaymentConsequences: false,
    credentialHold: false,
    refundPolicy: false,
  });

  const allAcknowledged = Object.values(acknowledged).every(Boolean);
  const remainingBalance = tuitionAmount - depositAmount;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-8 h-8 text-brand-orange-600" />
        <div>
          <h2 className="text-xl font-bold text-slate-900">Payment Plan Disclosure</h2>
          <p className="text-sm text-slate-500">Please review and acknowledge all terms</p>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-slate-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-slate-900 mb-3">Payment Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Program:</span>
            <span className="font-medium text-slate-900">{programName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Total Tuition:</span>
            <span className="font-medium text-slate-900">${tuitionAmount.toLocaleString('en-US')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Deposit Due Today:</span>
            <span className="font-medium text-slate-900">${depositAmount.toLocaleString('en-US')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Remaining Balance:</span>
            <span className="font-medium text-slate-900">${remainingBalance.toLocaleString('en-US')}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
            <span className="text-slate-600">Monthly Payment:</span>
            <span className="font-bold text-slate-900">${monthlyPayment.toLocaleString('en-US')}/month × {numberOfMonths} months</span>
          </div>
        </div>
      </div>

      {/* Acknowledgments */}
      <div className="space-y-4 mb-6">
        <h3 className="font-semibold text-slate-900">Required Acknowledgments</h3>
        
        {/* Total Cost */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged.totalCost}
            onChange={(e) => setAcknowledged(prev => ({ ...prev, totalCost: e.target.checked }))}
            className="mt-1 w-5 h-5 rounded border-slate-300 text-brand-orange-600 focus:ring-brand-orange-500"
          />
          <div>
            <p className="font-medium text-slate-900">I understand the total cost</p>
            <p className="text-sm text-slate-600">
              The total tuition for this program is ${tuitionAmount.toLocaleString('en-US')}. 
              I am paying ${depositAmount.toLocaleString('en-US')} today and ${remainingBalance.toLocaleString('en-US')} 
              over {numberOfMonths} monthly payments of ${monthlyPayment.toLocaleString('en-US')}.
            </p>
          </div>
        </label>

        {/* Autopay Required */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged.autopayRequired}
            onChange={(e) => setAcknowledged(prev => ({ ...prev, autopayRequired: e.target.checked }))}
            className="mt-1 w-5 h-5 rounded border-slate-300 text-brand-orange-600 focus:ring-brand-orange-500"
          />
          <div>
            <p className="font-medium text-slate-900">I agree to automatic payments</p>
            <p className="text-sm text-slate-600">
              Monthly payments will be automatically charged to my payment method on file. 
              <strong> Manual payments are not accepted.</strong> I am responsible for ensuring 
              my payment method remains valid and has sufficient funds.
            </p>
          </div>
        </label>

        {/* Missed Payment Consequences */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged.missedPaymentConsequences}
            onChange={(e) => setAcknowledged(prev => ({ ...prev, missedPaymentConsequences: e.target.checked }))}
            className="mt-1 w-5 h-5 rounded border-slate-300 text-brand-orange-600 focus:ring-brand-orange-500"
          />
          <div>
            <p className="font-medium text-slate-900">I understand the consequences of missed payments</p>
            <p className="text-sm text-slate-600">
              If a payment fails, I have {TIER3_INTERNAL_PLAN.rules.gracePeriodDays} days to resolve it. 
              After that, <strong>my access to courses and labs will be paused immediately</strong>. 
              A ${TIER3_INTERNAL_PLAN.rules.lateFee} late fee may apply. 
              After {TIER3_INTERNAL_PLAN.enforcement.missedPaymentsBeforeTermination} missed payments, 
              my enrollment may be terminated.
            </p>
          </div>
        </label>

        {/* Credential Hold */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged.credentialHold}
            onChange={(e) => setAcknowledged(prev => ({ ...prev, credentialHold: e.target.checked }))}
            className="mt-1 w-5 h-5 rounded border-slate-300 text-brand-orange-600 focus:ring-brand-orange-500"
          />
          <div>
            <p className="font-medium text-slate-900">I understand credentials are held until paid in full</p>
            <p className="text-sm text-slate-600">
              <strong>No certificates, transcripts, or credentials will be released until my balance is $0.</strong> 
              This includes completion certificates, state certification exam eligibility letters, 
              and any other official documents.
            </p>
          </div>
        </label>

        {/* Refund Policy */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged.refundPolicy}
            onChange={(e) => setAcknowledged(prev => ({ ...prev, refundPolicy: e.target.checked }))}
            className="mt-1 w-5 h-5 rounded border-slate-300 text-brand-orange-600 focus:ring-brand-orange-500"
          />
          <div>
            <p className="font-medium text-slate-900">I understand the refund policy</p>
            <p className="text-sm text-slate-600">
              The ${REFUND_POLICY.registrationFee} registration fee is non-refundable. 
              If I withdraw before the program starts, I receive a full refund minus the registration fee. 
              After the program starts, refunds are prorated based on completion. 
              <strong>No refunds are available after {REFUND_POLICY.afterProgramStart.noRefundAfterPercent}% completion.</strong>
            </p>
          </div>
        </label>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>Important:</strong> By proceeding, you are entering into a binding payment agreement. 
            Please ensure you can meet the payment obligations before continuing.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onDecline}
          className="flex-1 px-6 py-3 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={onAccept}
          disabled={!allAcknowledged}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
            allAcknowledged
              ? 'bg-brand-orange-600 text-white hover:bg-brand-orange-700'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {allAcknowledged && <span className="text-slate-400 flex-shrink-0">•</span>}
          I Agree & Continue
        </button>
      </div>

      {!allAcknowledged && (
        <p className="text-center text-sm text-slate-500 mt-4">
          Please acknowledge all terms above to continue
        </p>
      )}
    </div>
  );
}

export default PaymentDisclosure;

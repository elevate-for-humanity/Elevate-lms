import Link from 'next/link';

export function PendingApprovalNotice() {
  return (
    <div className="mb-8 bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-amber-900 mb-2">Pending Admin Approval</h3>
          <p className="text-amber-800 mb-3">
            Your onboarding is complete and your enrollment is under review. An administrator will review your application and documents.
          </p>
          <p className="text-amber-700 text-sm mb-4">
            Once approved, you will receive an email confirming when you can start class. Your courses will be unlocked at that time.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="flex items-center gap-1.5 bg-brand-green-100 text-brand-green-800 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-brand-green-500" />Onboarding Complete
            </span>
            <span className="flex items-center gap-1.5 bg-brand-green-100 text-brand-green-800 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-brand-green-500" />Documents Submitted
            </span>
            <span className="flex items-center gap-1.5 bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />Awaiting Approval
            </span>
            <span className="flex items-center gap-1.5 bg-white text-slate-500 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-slate-300" />Course Access Locked
            </span>
          </div>
          <p className="text-amber-600 text-sm mt-4">
            Questions? Call <strong>(317) 314-3757</strong> or{' '}
            <Link href="/support" className="underline hover:text-amber-800">get help online</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

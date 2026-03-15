import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import {
  DollarSign, CreditCard, Building2, Banknote,
  CheckCircle, AlertCircle, ChevronRight, TrendingUp,
  Calendar, Download, Settings, FileText,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export const metadata: Metadata = {
  title: 'Payroll & Payouts | Program Holder Portal',
  robots: { index: false, follow: false },
};

function fmt(n: number | null | undefined) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}
function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function ProgramHolderPayrollPage() {
  const { db, user, tenantId } = await requireProgramHolder();

  // Fetch payout profile
  const { data: payoutProfile } = await db
    .from('program_holder_payouts')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // Fetch payroll runs scoped to this holder's tenant
  const payrollRunsQuery = db
    .from('payroll_runs')
    .select('id, pay_period_start, pay_period_end, pay_date, status, total_gross, total_net, total_taxes, employee_count, created_at')
    .order('pay_date', { ascending: false })
    .limit(20);

  const { data: payrollRuns } = tenantId
    ? await payrollRunsQuery.eq('tenant_id', tenantId)
    : await payrollRunsQuery.eq('processed_by', user.id);

  // Fetch pay stubs for this user
  const { data: stubs } = await db
    .from('pay_stubs')
    .select('id, gross_pay, net_pay, federal_tax, state_tax, social_security, medicare, created_at, payroll_run_id, payroll_runs(pay_period_start, pay_period_end, pay_date, status)')
    .eq('employee_id', user.id)
    .order('created_at', { ascending: false })
    .limit(12);

  const runs = payrollRuns ?? [];
  const payStubs = stubs ?? [];

  const ytdGross = payStubs.reduce((s: number, p: any) => s + Number(p.gross_pay ?? 0), 0);
  const ytdNet = payStubs.reduce((s: number, p: any) => s + Number(p.net_pay ?? 0), 0);
  const lastRun = runs[0];

  const payoutSetupDone = !!payoutProfile?.payouts_enabled;
  const verificationStatus = payoutProfile?.verification_status ?? 'unverified';

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Program Holder', href: '/program-holder/dashboard' },
            { label: 'Payroll & Payouts' },
          ]} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Payroll &amp; Payouts</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your pay method, view earnings, and run payroll for your staff</p>
          </div>
          <Link href="/program-holder/payroll"
            className="flex items-center gap-2 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-white text-sm font-medium">
            <Settings className="w-4 h-4" /> Payout Settings
          </Link>
        </div>

        {/* Setup banner */}
        {!payoutSetupDone ? (
          <div className="mb-6 flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-900">Payout setup required</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Connect your bank account or choose a pay card to receive program revenue and payroll deposits.
              </p>
            </div>
            <Link href="/program-holder/payroll"
              className="flex-shrink-0 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-700">
              Set Up Now
            </Link>
          </div>
        ) : (
          <div className="mb-6 flex items-center gap-3 bg-brand-green-50 border border-brand-green-200 rounded-xl px-5 py-4">
            <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-brand-green-900">Payout account connected</p>
              <p className="text-sm text-brand-green-700">
                {payoutProfile?.bank_name ?? 'Bank account'} ···{payoutProfile?.external_account_last4 ?? '****'}
                {' · '}
                <span className="capitalize">{verificationStatus}</span>
              </p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
              verificationStatus === 'verified'
                ? 'bg-brand-green-200 text-brand-green-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {verificationStatus === 'verified' ? 'Verified' : 'Pending Verification'}
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'YTD Gross', value: fmt(ytdGross), icon: TrendingUp, color: 'brand-blue' },
            { label: 'YTD Net', value: fmt(ytdNet), icon: DollarSign, color: 'brand-green' },
            { label: 'Last Pay Date', value: lastRun ? fmtDate(lastRun.pay_date) : 'None yet', icon: Calendar, color: 'brand-orange' },
            { label: 'Pay Stubs', value: payStubs.length.toString(), icon: FileText, color: 'brand-blue' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border p-5">
              <div className={`w-9 h-9 rounded-lg bg-${color}-100 flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 text-${color}-600`} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">{label}</p>
              <p className="text-lg font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Run Payroll', desc: 'Process bi-weekly payroll for your staff', href: '/admin/hr/payroll', icon: DollarSign, primary: true },
            { label: 'W-9 & Tax Docs', desc: 'Submit or update your W-9 on file', href: '/program-holder/payroll/w9', icon: FileText, primary: false },
            { label: 'Staff Payroll Setup', desc: 'Help staff set up their pay method', href: '/onboarding/payroll-setup', icon: Settings, primary: false },
          ].map(({ label, desc, href, icon: Icon, primary }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-4 p-5 rounded-xl border transition group ${
                primary
                  ? 'bg-brand-blue-600 border-brand-blue-600 hover:bg-brand-blue-700 text-white'
                  : 'bg-white hover:border-brand-blue-300 hover:bg-brand-blue-50'
              }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                primary ? 'bg-brand-blue-500' : 'bg-white group-hover:bg-brand-blue-100'
              }`}>
                <Icon className={`w-5 h-5 ${primary ? 'text-white' : 'text-slate-500 group-hover:text-brand-blue-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${primary ? 'text-white' : 'text-slate-900'}`}>{label}</p>
                <p className={`text-xs mt-0.5 ${primary ? 'text-brand-blue-100' : 'text-slate-400'}`}>{desc}</p>
              </div>
              <ChevronRight className={`w-4 h-4 flex-shrink-0 ${primary ? 'text-brand-blue-200' : 'text-slate-300'}`} />
            </Link>
          ))}
        </div>

        {/* Pay stubs */}
        <div className="bg-white rounded-xl border overflow-hidden mb-8">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Pay History</h2>
            <span className="text-sm text-slate-500">{payStubs.length} records</span>
          </div>
          {payStubs.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400">
              <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No pay stubs yet. Your first stub will appear after your first payroll run.</p>
              <Link href="/admin/hr/payroll" className="mt-3 inline-flex items-center gap-1 text-brand-blue-600 text-sm font-medium hover:underline">
                Go to Payroll <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {payStubs.map((stub: any) => {
                const run = stub.payroll_runs;
                const taxes = Number(stub.federal_tax ?? 0) + Number(stub.state_tax ?? 0) +
                  Number(stub.social_security ?? 0) + Number(stub.medicare ?? 0);
                return (
                  <div key={stub.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="w-9 h-9 bg-brand-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-4 h-4 text-brand-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">
                        {run
                          ? `${new Date(run.pay_period_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(run.pay_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                          : fmtDate(stub.created_at)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Pay date: {run ? fmtDate(run.pay_date) : '—'}
                        {run?.status && (
                          <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${
                            run.status === 'paid' ? 'bg-brand-green-100 text-brand-green-700' : 'bg-white text-slate-600'
                          }`}>{run.status}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-5 text-sm">
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Gross</p>
                        <p className="font-semibold text-slate-900">{fmt(stub.gross_pay)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Taxes</p>
                        <p className="font-semibold text-slate-600">{fmt(taxes)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Net</p>
                        <p className="font-bold text-brand-green-700">{fmt(stub.net_pay)}</p>
                      </div>
                      <button title="Download" className="p-2 text-slate-400 hover:text-brand-blue-600 rounded-lg hover:bg-brand-blue-50 transition">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payroll runs (org-level) */}
        {runs.length > 0 && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Payroll Runs</h2>
              <Link href="/admin/hr/payroll" className="text-sm text-brand-blue-600 hover:underline font-medium">
                Manage
              </Link>
            </div>
            <div className="divide-y">
              {runs.slice(0, 5).map((run: any) => (
                <div key={run.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        run.status === 'paid' ? 'bg-brand-green-100 text-brand-green-700' :
                        run.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-white text-slate-600'
                      }`}>{run.status}</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {fmtDate(run.pay_period_start)} – {fmtDate(run.pay_period_end)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Pay date: {fmtDate(run.pay_date)} · {run.employee_count ?? 0} employees</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Net</p>
                    <p className="font-bold text-brand-green-700">{fmt(run.total_net)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

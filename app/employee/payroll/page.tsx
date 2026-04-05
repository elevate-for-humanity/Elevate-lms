import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  DollarSign, Download, FileText, Clock,
  CreditCard, Building2, Banknote, Settings, CheckCircle, AlertCircle
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My Payroll | Elevate For Humanity',
  robots: { index: false, follow: false },
};

function fmt(n: number | null) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}
function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtPeriod(start: string, end: string) {
  const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${s} – ${e}`;
}

const PAY_METHOD_ICONS: Record<string, any> = {
  direct_deposit: Building2,
  pay_card: CreditCard,
  check: Banknote,
};
const PAY_METHOD_LABELS: Record<string, string> = {
  direct_deposit: 'Direct Deposit',
  pay_card: 'Elevate Pay Card',
  check: 'Paper Check',
  DIRECT_DEPOSIT: 'Direct Deposit',
  PAY_CARD: 'Elevate Pay Card',
  CHECK: 'Paper Check',
};

export default async function EmployeePayrollPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/employee/payroll');

  // Fetch pay stubs for this employee
  const { data: stubs } = await supabase
    .from('pay_stubs')
    .select(`
      id, gross_pay, net_pay, federal_tax, state_tax,
      social_security, medicare, deductions, created_at,
      payroll_run_id,
      payroll_runs(pay_period_start, pay_period_end, pay_date, status)
    `)
    .eq('employee_id', user.id)
    .order('created_at', { ascending: false })
    .limit(24);

  // Fetch payroll profile (pay method)
  const { data: payrollProfile } = await supabase
    .from('payroll_profiles')
    .select('bank_name, account_type, direct_deposit_enabled, status')
    .eq('user_id', user.id)
    .maybeSingle();

  // Fetch payout rate config
  const { data: rateConfig } = await supabase
    .from('payout_rate_configs')
    .select('rate_amount, rate_type, effective_date')
    .order('effective_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const payStubs = stubs ?? [];
  const ytdGross = payStubs.reduce((s: number, p: any) => s + Number(p.gross_pay ?? 0), 0);
  const ytdNet = payStubs.reduce((s: number, p: any) => s + Number(p.net_pay ?? 0), 0);
  const ytdTaxes = payStubs.reduce((s: number, p: any) =>
    s + Number(p.federal_tax ?? 0) + Number(p.state_tax ?? 0) + Number(p.social_security ?? 0) + Number(p.medicare ?? 0), 0);

  const payMethodKey = payrollProfile?.direct_deposit_enabled ? 'direct_deposit' : 'check';
  const PayMethodIcon = PAY_METHOD_ICONS[payMethodKey] ?? Banknote;

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Employee', href: '/employee' }, { label: 'Payroll' }]} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Payroll</h1>
            <p className="text-slate-500 mt-1">Pay stubs, earnings history, and tax documents</p>
          </div>
          <Link href="/onboarding/payroll-setup"
            className="flex items-center gap-2 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-white text-sm font-medium">
            <Settings className="w-4 h-4" /> Update Pay Method
          </Link>
        </div>

        {/* Pay method banner */}
        {!payrollProfile ? (
          <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-5 py-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
            <div className="flex-1">
              <p className="font-semibold">Payroll setup incomplete</p>
              <p className="text-sm text-amber-700">You won't receive payment until you complete payroll setup.</p>
            </div>
            <Link href="/onboarding/payroll-setup"
              className="flex-shrink-0 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-700">
              Set Up Now
            </Link>
          </div>
        ) : (
          <div className="mb-6 flex items-center gap-3 bg-brand-green-50 border border-brand-green-200 text-brand-green-800 rounded-xl px-5 py-4">
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-brand-green-600" />
            <div className="flex-1 flex items-center gap-3">
              <PayMethodIcon className="w-5 h-5 text-brand-green-600" />
              <div>
                <p className="font-semibold">{PAY_METHOD_LABELS[payMethodKey]}</p>
                {payrollProfile.bank_name && (
                  <p className="text-sm text-brand-green-700">{payrollProfile.bank_name} · {payrollProfile.account_type}</p>
                )}
              </div>
            </div>
            <span className="text-xs bg-brand-green-200 text-brand-green-800 px-2 py-1 rounded-full font-medium capitalize">
              {payrollProfile.status ?? 'active'}
            </span>
          </div>
        )}

        {/* YTD Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'YTD Gross', value: fmt(ytdGross), color: 'brand-blue' },
            { label: 'YTD Net', value: fmt(ytdNet), color: 'brand-green' },
            { label: 'YTD Taxes', value: fmt(ytdTaxes), color: 'brand-orange' },
            { label: 'Pay Rate', value: rateConfig ? `${fmt(Number(rateConfig.rate_amount))}${rateConfig.rate_type === 'hourly' ? '/hr' : '/yr'}` : '—', color: 'brand-blue' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">{label}</p>
              <p className={`text-xl font-bold text-${color}-600`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Pay Stubs */}
        <div className="bg-white rounded-xl border overflow-hidden mb-8">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Pay Stubs</h2>
            <span className="text-sm text-slate-500">{payStubs.length} records</span>
          </div>
          {payStubs.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400">
              <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No pay stubs yet. Your first stub will appear after your first payroll run.</p>
            </div>
          ) : (
            <div className="divide-y">
              {payStubs.map((stub: any) => {
                const run = stub.payroll_runs;
                return (
                  <div key={stub.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="w-10 h-10 bg-brand-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-5 h-5 text-brand-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">
                        {run ? fmtPeriod(run.pay_period_start, run.pay_period_end) : fmtDate(stub.created_at)}
                      </p>
                      <p className="text-xs text-slate-400">
                        Pay date: {run ? fmtDate(run.pay_date) : '—'}
                        {run?.status && (
                          <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${
                            run.status === 'paid' ? 'bg-brand-green-100 text-brand-green-700' : 'bg-white text-slate-600'
                          }`}>{run.status}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Gross</p>
                        <p className="font-semibold text-slate-900">{fmt(stub.gross_pay)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Taxes</p>
                        <p className="font-semibold text-slate-600">
                          {fmt((Number(stub.federal_tax ?? 0) + Number(stub.state_tax ?? 0) + Number(stub.social_security ?? 0) + Number(stub.medicare ?? 0)))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Net</p>
                        <p className="font-bold text-brand-green-700">{fmt(stub.net_pay)}</p>
                      </div>
                      <button
                        title="Download pay stub"
                        className="p-2 text-slate-400 hover:text-brand-blue-600 transition rounded-lg hover:bg-brand-blue-50">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tax Documents */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Tax Documents</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: `W-2 (${new Date().getFullYear() - 1})`, note: `Available Jan 31, ${new Date().getFullYear()}`, available: false },
              { label: 'W-4 Withholding', note: 'Update federal withholding elections', available: true, href: '/employee/documents' },
              { label: 'W-9 on File', note: 'Taxpayer identification on file', available: !!payrollProfile },
              { label: `1099 (${new Date().getFullYear() - 1})`, note: 'For contract workers only', available: false },
            ].map(({ label, note, available, href }) => (
              <div key={label} className="flex items-center gap-3 border rounded-xl p-4">
                <FileText className={`w-8 h-8 flex-shrink-0 ${available ? 'text-brand-blue-600' : 'text-slate-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${available ? 'text-slate-900' : 'text-slate-400'}`}>{label}</p>
                  <p className="text-xs text-slate-400">{note}</p>
                </div>
                {available && href ? (
                  <Link href={href} className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium">Edit</Link>
                ) : available ? (
                  <CheckCircle className="w-5 h-5 text-brand-green-500" />
                ) : (
                  <Clock className="w-5 h-5 text-slate-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

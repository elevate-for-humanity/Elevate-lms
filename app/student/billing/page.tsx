import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Receipt,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Billing & Payments | Student Portal',
  description: 'View your payment plan, schedule, and payment history.',
};

export const dynamic = 'force-dynamic';

export default async function StudentBillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/student/billing');
  }

  // Fetch student's subscription from student_subscriptions table
  const { data: subscription } = await supabase
    .from('student_subscriptions')
    .select('*')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch tuition subscription if exists
  const { data: tuitionSub } = await supabase
    .from('tuition_subscriptions')
    .select(`
      *,
      programs:program_id (name, title)
    `)
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch payment history from student_payments
  const { data: studentPayments } = await supabase
    .from('student_payments')
    .select('*')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch payment history from tuition_payments
  const { data: tuitionPayments } = await supabase
    .from('tuition_payments')
    .select('*')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch enrollment info for program name and funding type
  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select(`
      *,
      programs:program_id (name, title)
    `)
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Also check enrollments table (alternate table name)
  const { data: altEnrollment } = await supabase
    .from('enrollments')
    .select(`
      *,
      programs:program_id (name, title)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const activeEnrollment = enrollment || altEnrollment;
  const fundingType = activeEnrollment?.funding_type || activeEnrollment?.funding_source || null;
  const isFunded = fundingType && ['wioa', 'wrg', 'pell', 'grant', 'scholarship', 'employer'].includes(fundingType.toLowerCase());

  // Build payment plan from actual database data
  let paymentPlan = null;
  
  if (subscription) {
    paymentPlan = {
      id: subscription.id,
      program_name: activeEnrollment?.programs?.name || activeEnrollment?.programs?.title || null,
      total_amount: subscription.weekly_amount && subscription.total_weeks 
        ? subscription.weekly_amount * subscription.total_weeks 
        : null,
      weekly_amount: subscription.weekly_amount,
      total_weeks: subscription.total_weeks,
      weeks_paid: subscription.weeks_paid || 0,
      status: subscription.status,
      next_payment_date: subscription.current_period_end,
      start_date: subscription.created_at,
      stripe_subscription_id: subscription.stripe_subscription_id,
      funding_type: fundingType,
      is_funded: isFunded,
    };
  } else if (tuitionSub) {
    paymentPlan = {
      id: tuitionSub.id,
      program_name: tuitionSub.programs?.name || tuitionSub.programs?.title || null,
      total_amount: tuitionSub.monthly_amount && tuitionSub.total_installments
        ? tuitionSub.monthly_amount * tuitionSub.total_installments
        : null,
      weekly_amount: tuitionSub.monthly_amount,
      total_weeks: tuitionSub.total_installments,
      weeks_paid: tuitionSub.installments_paid || 0,
      status: tuitionSub.status,
      next_payment_date: tuitionSub.next_payment_date || null,
      start_date: tuitionSub.created_at,
      stripe_subscription_id: tuitionSub.stripe_subscription_id,
      funding_type: fundingType,
      is_funded: isFunded,
    };
  } else if (activeEnrollment) {
    // Student has enrollment but no payment subscription - could be funded (WIOA/WRG) or pending
    paymentPlan = {
      id: activeEnrollment.id,
      program_name: activeEnrollment.programs?.name || activeEnrollment.programs?.title || null,
      total_amount: isFunded ? 0 : (activeEnrollment.tuition_amount || null),
      weekly_amount: isFunded ? 0 : null,
      total_weeks: null,
      weeks_paid: 0,
      status: isFunded ? 'funded' : (activeEnrollment.status || 'active'),
      next_payment_date: null,
      start_date: activeEnrollment.created_at || activeEnrollment.enrolled_at,
      stripe_subscription_id: null,
      funding_type: fundingType,
      is_funded: isFunded,
    };
  }

  // Combine and dedupe payment history
  const paymentMap = new Map();
  
  (studentPayments || []).forEach((p: any) => {
    paymentMap.set(p.id, {
      id: p.id,
      amount: p.amount,
      type: p.type,
      status: p.status,
      created_at: p.created_at,
    });
  });

  (tuitionPayments || []).forEach((p: any) => {
    if (!paymentMap.has(p.id)) {
      paymentMap.set(p.id, {
        id: p.id,
        amount: p.amount_paid,
        type: p.payment_option === 'installment' ? 'weekly_payment' : p.payment_option,
        status: p.status,
        created_at: p.created_at,
      });
    }
  });

  const allPayments = Array.from(paymentMap.values())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Calculate totals from actual payments
  const totalPaid = allPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const remainingBalance = paymentPlan?.total_amount 
    ? Math.max(0, paymentPlan.total_amount - totalPaid)
    : null;

  const progressPercent = paymentPlan?.total_weeks && paymentPlan.total_weeks > 0
    ? Math.round((paymentPlan.weeks_paid / paymentPlan.total_weeks) * 100)
    : 0;

  // Generate upcoming schedule from actual data
  const upcomingPayments = paymentPlan && paymentPlan.status === 'active' && paymentPlan.weekly_amount
    ? generateUpcomingSchedule(
        paymentPlan.weeks_paid,
        paymentPlan.total_weeks,
        paymentPlan.weekly_amount,
        paymentPlan.next_payment_date
      )
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Student', href: '/student' }, { label: 'Billing' }]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Billing & Payments</h1>
            <p className="text-gray-600 mt-1">Manage your payment plan and view history</p>
          </div>
          <Link
            href="/api/billing/portal"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
          >
            <CreditCard className="w-4 h-4" />
            Update Payment Method
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        {/* Payment Plan Status */}
        {paymentPlan ? (
          <div className="bg-white rounded-xl border shadow-sm mb-6">
            <div className="p-6 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {paymentPlan.is_funded ? 'Funding Status' : 'Payment Plan'}
                  </h2>
                  {paymentPlan.program_name && (
                    <p className="text-gray-600">{paymentPlan.program_name}</p>
                  )}
                  {paymentPlan.funding_type && (
                    <p className="text-sm text-blue-600 font-medium mt-1">
                      Funding: {paymentPlan.funding_type.toUpperCase()}
                    </p>
                  )}
                </div>
                <StatusBadge status={paymentPlan.status} isFunded={paymentPlan.is_funded} />
              </div>
            </div>

            <div className="p-6">
              {/* Progress Bar */}
              {paymentPlan.total_weeks && paymentPlan.total_weeks > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Payment Progress</span>
                    <span className="text-sm text-gray-600">
                      {paymentPlan.weeks_paid} of {paymentPlan.total_weeks} payments
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        paymentPlan.status === 'completed' ? 'bg-green-500' :
                        paymentPlan.status === 'past_due' ? 'bg-red-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{progressPercent}% complete</p>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-500">
                      {paymentPlan.is_funded ? 'Tuition Cost' : 'Total Amount'}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    ${(paymentPlan.total_amount || 0).toLocaleString()}
                  </p>
                </div>

                <div className={`rounded-lg p-4 ${paymentPlan.is_funded ? 'bg-emerald-50' : 'bg-green-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className={`w-4 h-4 ${paymentPlan.is_funded ? 'text-emerald-600' : 'text-green-600'}`} />
                    <span className={`text-xs ${paymentPlan.is_funded ? 'text-emerald-700' : 'text-green-700'}`}>
                      {paymentPlan.is_funded ? 'Funded Amount' : 'Total Paid'}
                    </span>
                  </div>
                  <p className={`text-xl font-bold ${paymentPlan.is_funded ? 'text-emerald-700' : 'text-green-700'}`}>
                    ${paymentPlan.is_funded ? (paymentPlan.total_amount || 0).toLocaleString() : totalPaid.toLocaleString()}
                  </p>
                </div>

                <div className={`rounded-lg p-4 ${paymentPlan.is_funded ? 'bg-emerald-50' : 'bg-orange-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {paymentPlan.is_funded ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-orange-600" />
                    )}
                    <span className={`text-xs ${paymentPlan.is_funded ? 'text-emerald-700' : 'text-orange-700'}`}>
                      {paymentPlan.is_funded ? 'Your Cost' : 'Remaining'}
                    </span>
                  </div>
                  <p className={`text-xl font-bold ${paymentPlan.is_funded ? 'text-emerald-700' : 'text-orange-700'}`}>
                    ${paymentPlan.is_funded ? '0' : (remainingBalance || 0).toLocaleString()}
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-blue-700">
                      {paymentPlan.is_funded ? 'Weekly Payment' : 'Payment Amount'}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-blue-700">
                    ${paymentPlan.is_funded ? '0' : (paymentPlan.weekly_amount || 0)}
                  </p>
                </div>
              </div>

              {/* Next Payment Alert */}
              {paymentPlan.status === 'active' && paymentPlan.next_payment_date && paymentPlan.weekly_amount && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">Next Payment</p>
                      <p className="text-sm text-blue-700">
                        ${paymentPlan.weekly_amount} on {formatDate(paymentPlan.next_payment_date)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {paymentPlan.status === 'past_due' && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-red-900">Payment Past Due</p>
                      <p className="text-sm text-red-700">
                        Please update your payment method to avoid interruption to your course access.
                      </p>
                    </div>
                    <Link
                      href="/api/billing/portal"
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                    >
                      Update Payment
                    </Link>
                  </div>
                </div>
              )}

              {paymentPlan.status === 'completed' && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-900">Paid in Full</p>
                      <p className="text-sm text-green-700">
                        You have completed all payments for this program.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border shadow-sm p-8 text-center mb-6">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No Active Payment Plan</h2>
            <p className="text-gray-600 mb-4">
              You don&apos;t have an active payment plan. If you&apos;re enrolled in a program with tuition,
              your payment plan will appear here.
            </p>
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Programs
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Upcoming Payment Schedule */}
        {upcomingPayments.length > 0 && (
          <div className="bg-white rounded-xl border shadow-sm mb-6">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Payments</h2>
              <p className="text-sm text-gray-600">Your scheduled payments</p>
            </div>
            <div className="divide-y">
              {upcomingPayments.slice(0, 8).map((payment, index) => (
                <div key={index} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {paymentPlan!.weeks_paid + index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Payment {paymentPlan!.weeks_paid + index + 1}
                      </p>
                      <p className="text-sm text-gray-500">{formatDate(payment.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${payment.amount}</p>
                    {index === 0 && (
                      <span className="text-xs text-blue-600 font-medium">Next payment</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {upcomingPayments.length > 8 && (
              <div className="p-4 border-t bg-gray-50 text-center">
                <p className="text-sm text-gray-600">
                  + {upcomingPayments.length - 8} more payments remaining
                </p>
              </div>
            )}
          </div>
        )}

        {/* Payment History */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
            <p className="text-sm text-gray-600">Your transactions</p>
          </div>

          {allPayments.length > 0 ? (
            <div className="divide-y">
              {allPayments.map((payment) => (
                <div key={payment.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      payment.status === 'completed' ? 'bg-green-100' :
                      payment.status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'
                    }`}>
                      {payment.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : payment.status === 'failed' ? (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {payment.type === 'weekly_payment' ? 'Weekly Payment' :
                         payment.type === 'setup_fee' ? 'Enrollment Deposit' :
                         payment.type === 'one_time' ? 'One-time Payment' :
                         payment.type || 'Payment'}
                      </p>
                      <p className="text-sm text-gray-500">{formatDate(payment.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      payment.status === 'completed' ? 'text-green-600' :
                      payment.status === 'failed' ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      ${(payment.amount || 0).toFixed(2)}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                      payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {payment.status ? payment.status.charAt(0).toUpperCase() + payment.status.slice(1) : 'Unknown'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No payment history</p>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-slate-100 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Questions about your payment plan or need to make changes?
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/student/support"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Contact Support
            </Link>
            <Link
              href="tel:317-314-3757"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Call (317) 314-3757
            </Link>
            <a
              href="mailto:billing@elevateforhumanity.org"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Email Billing
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, isFunded }: { status: string; isFunded?: boolean }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
    completed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Paid in Full' },
    past_due: { bg: 'bg-red-100', text: 'text-red-700', label: 'Past Due' },
    canceled: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Canceled' },
    unpaid: { bg: 'bg-red-100', text: 'text-red-700', label: 'Unpaid' },
    funded: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Fully Funded' },
  };

  // Override for funded students
  if (isFunded) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700">
        <CheckCircle className="w-4 h-4" />
        Fully Funded
      </span>
    );
  }

  const { bg, text, label } = config[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${bg} ${text}`}>
      {status === 'active' && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
      {label}
    </span>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function generateUpcomingSchedule(
  weeksPaid: number,
  totalWeeks: number,
  weeklyAmount: number,
  nextPaymentDate: string | null
): { date: string; amount: number }[] {
  const schedule: { date: string; amount: number }[] = [];
  const remainingWeeks = totalWeeks - weeksPaid;

  if (remainingWeeks <= 0 || !weeklyAmount) return schedule;

  const startDate = nextPaymentDate ? new Date(nextPaymentDate) : new Date();

  for (let i = 0; i < remainingWeeks; i++) {
    const paymentDate = new Date(startDate);
    paymentDate.setDate(paymentDate.getDate() + (i * 7));

    schedule.push({
      date: paymentDate.toISOString(),
      amount: weeklyAmount,
    });
  }

  return schedule;
}

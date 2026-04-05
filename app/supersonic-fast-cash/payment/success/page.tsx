import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/supersonic-fast-cash/payment/success');

  // Look up payment record — status is set by webhook, not this page
  const admin = createAdminClient();
  const { data: payment } = await admin!
    .from('tax_payments')
    .select('id, status, amount, paid_at, stripe_checkout_session_id')
    .eq('client_id', user.id)
    .eq('stripe_checkout_session_id', session_id ?? '')
    .maybeSingle();

  // If webhook hasn't fired yet, show pending state (Stripe usually fires within seconds)
  const isPaid = payment?.status === 'paid';

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isPaid ? 'bg-green-100' : 'bg-yellow-100'}`}>
            <CheckCircle className={`w-10 h-10 ${isPaid ? 'text-green-600' : 'text-yellow-500'}`} />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isPaid ? 'Payment Confirmed' : 'Payment Processing'}
          </h1>
          <p className="text-black text-sm mb-6">
            {isPaid
              ? 'Your $49 deposit has been received. You can now upload your tax documents.'
              : 'Your payment is being confirmed. This usually takes a few seconds. Refresh if needed.'}
          </p>

          {payment && (
            <div className="bg-gray-50 rounded-lg p-4 text-left text-sm mb-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-black">Amount</span>
                <span className="font-semibold">${((payment.amount ?? 0) / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black">Status</span>
                <span className={`font-semibold capitalize ${isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                  {payment.status}
                </span>
              </div>
              {payment.paid_at && (
                <div className="flex justify-between">
                  <span className="text-black">Paid at</span>
                  <span className="font-medium">
                    {new Date(payment.paid_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              )}
            </div>
          )}

          {isPaid ? (
            <Link
              href="/supersonic-fast-cash/upload-documents"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Upload Your Documents <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
            >
              Refresh Status
            </button>
          )}
        </div>

        <p className="text-center text-xs text-black mt-4">
          Questions? Contact us at{' '}
          <a href="mailto:elizabethpowell6262@gmail.com" className="underline">
            elizabethpowell6262@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}

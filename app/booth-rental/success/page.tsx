import Link from 'next/link';
import { CheckCircle2, Calendar, CreditCard, Phone } from 'lucide-react';

export const metadata = {
  title: 'Rental Setup Complete | Elevate for Humanity',
};

export default function BoothRentalSuccessPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full space-y-6">

        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
          <h1 className="text-2xl font-black text-slate-900">You&apos;re all set!</h1>
          <p className="text-slate-600">
            Your booth rental agreement is signed and your payment is confirmed.
            Elevate staff will contact you within 1 business day to confirm your
            booth assignment and first day.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-bold text-slate-900">What happens next</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Staff will reach out</p>
                <p className="text-xs text-slate-500">We&apos;ll confirm your booth number, key access, and start date within 1 business day.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Weekly billing starts Friday</p>
                <p className="text-xs text-slate-500">Your card on file will be charged automatically every Friday. You&apos;ll receive a receipt by email.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Keep your card current</p>
                <p className="text-xs text-slate-500">A $25 late fee applies if payment fails. Update your card any time by contacting us.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-slate-500">Questions? Call or text <a href="tel:3173143757" className="font-semibold text-brand-blue-600">(317) 314-3757</a></p>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-600">← Back to home</Link>
        </div>

      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { CheckCircle, Phone, Mail, Calendar } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata = { title: `Rental Confirmed — ${PLATFORM_DEFAULTS.orgName}` };

export default function BoothRentalConfirmedPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-brand-green-100 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-brand-green-600" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Rental Activated!</h1>
          <p className="text-slate-500">
            Your Booth Rental Agreement is signed and your rental is now active. A confirmation
            email has been sent to you.
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-6 text-left space-y-4">
          <h2 className="font-bold text-slate-900">What happens next</h2>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-brand-blue-600 mt-0.5 shrink-0" />
              Our team will contact you within 1 business day to schedule your move-in date.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-brand-blue-600 mt-0.5 shrink-0" />
              Weekly rent will be charged automatically every Friday to your card on file.
            </li>
            <li className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-brand-blue-600 mt-0.5 shrink-0" />
              A copy of your signed agreement is on file with {PLATFORM_DEFAULTS.orgName}.
            </li>
          </ul>
        </div>

        <div className="bg-brand-blue-50 rounded-xl p-5 text-sm text-brand-blue-800">
          <p className="font-semibold mb-1">Questions?</p>
          <p className="flex items-center justify-center gap-2">
            <Phone className="w-4 h-4" />
            <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`} className="underline">{PLATFORM_DEFAULTS.supportPhone}</a>
            <span>·</span>
            <Mail className="w-4 h-4" />
            <a href="mailto:info@elevateforhumanity.org" className="underline">
              info@elevateforhumanity.org
            </a>
          </p>
        </div>

        <Link
          href="/"
          className="inline-block px-6 py-3 bg-brand-blue-600 hover:bg-brand-blue-700 text-white rounded-xl font-semibold text-sm transition"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}

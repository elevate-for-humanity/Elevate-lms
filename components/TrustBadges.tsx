import Image from 'next/image';
import { Shield, Award, Lock } from 'lucide-react';

export function TrustBadges() {
  return (
    <section className="py-12 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-black mb-2">
            Trusted by Government Agencies & Employers
          </h2>
          <p className="text-black">
            Accredited, compliant, and recognized by leading workforce development organizations
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-items-center">
          {/* FERPA Compliant */}
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mb-3">
              <Shield className="w-8 h-8 text-brand-blue-600" />
            </div>
            <div className="text-sm font-semibold text-black">FERPA</div>
            <div className="text-xs text-black">Compliant</div>
          </div>

          {/* WIOA Approved */}
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mb-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
            </div>
            <div className="text-sm font-semibold text-black">WIOA</div>
            <div className="text-xs text-black">Approved Provider</div>
          </div>

          {/* Industry Certified */}
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-16 h-16 bg-brand-orange-100 rounded-full flex items-center justify-center mb-3">
              <Award className="w-8 h-8 text-brand-orange-600" />
            </div>
            <div className="text-sm font-semibold text-black">Industry</div>
            <div className="text-xs text-black">Certified Programs</div>
          </div>

          {/* Data Security */}
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mb-3">
              <Lock className="w-8 h-8 text-brand-blue-600" />
            </div>
            <div className="text-sm font-semibold text-black">Secure</div>
            <div className="text-xs text-black">AES-256 Encrypted</div>
          </div>
        </div>

        {/* Partner Logos */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-center text-sm text-slate-800 mb-6">
            Partnered with leading workforce development organizations
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
            <div className="h-14 flex items-center justify-center">
              <Image
                src="/images/partners/workone.webp"
                alt="WorkOne Indiana"
                width={120}
                height={48}
                className="object-contain h-10 w-auto"
              />
            </div>
            <div className="h-14 flex items-center justify-center">
              <Image
                src="/images/partners/dwd.webp"
                alt="Indiana Department of Workforce Development"
                width={120}
                height={48}
                className="object-contain h-10 w-auto"
              />
            </div>
            <div className="h-14 flex items-center justify-center">
              <Image
                src="/images/partners/usdol.webp"
                alt="U.S. Department of Labor"
                width={120}
                height={48}
                className="object-contain h-10 w-auto"
              />
            </div>
            <div className="h-14 flex items-center justify-center">
              <Image
                src="/images/partners/nextleveljobs.webp"
                alt="Next Level Jobs Indiana"
                width={120}
                height={48}
                className="object-contain h-10 w-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SecurityBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-green-50 border border-brand-green-200 rounded-lg">
      <Lock className="w-4 h-4 text-brand-green-600" />
      <span className="text-sm font-medium text-brand-green-900">
        Secure & FERPA Compliant
      </span>
    </div>
  );
}

export function AccreditationBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-50 border border-brand-blue-200 rounded-lg">
      <Award className="w-4 h-4 text-brand-blue-600" />
      <span className="text-sm font-medium text-brand-blue-900">
        WIOA Approved Provider
      </span>
    </div>
  );
}

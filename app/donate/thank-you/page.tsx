import Link from 'next/link';
import { Metadata } from 'next';
import { CheckCircle, Heart, ArrowRight, Users, Award, Briefcase } from 'lucide-react';
import { ConversionPixel } from '@/components/analytics/ConversionPixel';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Thank You for Your Donation | Sit Selfish Inc × ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Your gift is making a difference in the lives of workforce training participants.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function DonateThankYouPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-center px-4 py-16">
      <ConversionPixel type="DONATE" />

      <div className="max-w-2xl w-full text-center">
        {/* Success icon */}
        <div className="w-24 h-24 bg-brand-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-500/30">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>

        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-6">
          <Heart className="w-4 h-4 text-red-400" />
          Sit Selfish Inc × {PLATFORM_DEFAULTS.orgName}
        </div>

        <h1 className="text-4xl md:text-5xl font-black mb-4">
          Thank You!
        </h1>
        <p className="text-xl text-slate-300 mb-4">
          Your donation has been received and is already making a difference.
        </p>
        <p className="text-slate-400 mb-10">
          A tax receipt will be sent to your email address. Your gift is 100% tax-deductible
          as Sit Selfish Inc is a registered 501(c)(3) nonprofit organization.
        </p>

        {/* Impact preview */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { icon: Users, value: 'Many', label: 'Students Trained' },
            { icon: Award, value: '200+', label: 'Credentials Issued' },
            { icon: Briefcase, value: '150+', label: 'Jobs Placed' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
              <stat.icon className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-black text-white">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/impact"
            className="bg-white text-blue-700 font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition flex items-center justify-center gap-2"
          >
            See Your Impact <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/programs"
            className="border-2 border-white/30 text-slate-900 font-bold px-8 py-3 rounded-xl hover:bg-white/10 transition"
          >
            Browse Programs
          </Link>
          <Link
            href="/donate"
            className="border-2 border-white/30 text-slate-900 font-bold px-8 py-3 rounded-xl hover:bg-white/10 transition flex items-center justify-center gap-2"
          >
            <Heart className="w-4 h-4 text-red-400" />
            Give Again
          </Link>
        </div>
      </div>
    </div>
  );
}

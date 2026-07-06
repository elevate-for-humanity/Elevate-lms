import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Users, Shield, Award, Building2, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Become a Host Shop | Elevate for Humanity',
  description: 'Partner with Elevate for Humanity as a host shop. Train apprentices, get motivated help, and build your legacy.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/host-shop',
  },
};

export default function HostShopPage() {
  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[300px] max-h-[500px] w-full overflow-hidden">
        <Image
          src="/images/pages/barber-training.webp"
          alt="Host shop training environment"
          fill
          sizes="100vw"
          className="object-cover"
          priority
          placeholder="empty"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 text-white">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Become a Host Shop</h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl">
              Partner with Elevate for Humanity to train the next generation of barbers and cosmetologists while growing your team.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/programs/barber-apprenticeship/host-shops/apply" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-3 px-8 rounded-lg transition flex items-center gap-2">
                Apply as Host Shop <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/programs/barber-apprenticeship/host-shops" className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-8 rounded-lg transition border border-white/30">
                View Partner Shops
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* For Employers - Different from Apprentices */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">For Employers & Shop Owners</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              This page is for businesses wanting to hire and train apprentices. Students looking for apprenticeship programs should visit our <Link href="/apprenticeships" className="text-brand-blue-600 hover:underline">Apprenticeships page</Link>.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <div className="w-16 h-16 bg-brand-green-100 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-brand-green-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Trained Help</h3>
              <p className="text-slate-600 mb-4">
                Get pre-screened apprentices ready to handle shampoos, prep work, and basic services under your supervision.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-green-600" /> Extra hands during busy hours</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-green-600" /> Pre-screened, motivated learners</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-green-600" /> Potential future employees</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-brand-blue-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Zero Paperwork</h3>
              <p className="text-slate-600 mb-4">
                We handle all the administrative burden - hour tracking, state compliance, and documentation.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-blue-600" /> Digital hour tracking system</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-blue-600" /> State board compliance handled</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-blue-600" /> Simple attendance verification</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
                <Award className="w-8 h-8 text-amber-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Build Your Legacy</h3>
              <p className="text-slate-600 mb-4">
                Pass on your skills and strengthen the profession. Many host shops hire their best apprentices after completion.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600" /> Train professionals your way</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600" /> First pick of new talent</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600" /> Recognition as training shop</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">Host Shop Requirements</h2>
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-slate-200">
            <ul className="space-y-4">
              {[
                'Active Indiana barbershop or cosmetology license',
                'Licensed barber or cosmetologist supervisor on staff',
                'Clean, professional workspace meeting state board standards',
                'Willingness to train and mentor apprentices',
                'Ability to verify apprentice hours worked',
              ].map((req, i) => (
                <li key={i} className="flex items-start gap-3 text-lg text-slate-700">
                  <CheckCircle2 className="w-6 h-6 text-brand-green-600 shrink-0 mt-0.5" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">Programs We Offer</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Barber Apprenticeship</h3>
              <p className="text-slate-600 mb-6">
                DOL-registered barber apprenticeship. 1,500+ hours of supervised on-the-job training with state board exam prep.
              </p>
              <Link href="/programs/barber-apprenticeship/host-shops" className="text-brand-blue-600 hover:underline font-semibold flex items-center gap-2">
                Learn more <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Cosmetology Apprenticeship</h3>
              <p className="text-slate-600 mb-6">
                DOL-registered cosmetology apprenticeship. Train apprentices in beauty services including hair, nails, and skincare.
              </p>
              <Link href="/programs/cosmetology-apprenticeship" className="text-brand-blue-600 hover:underline font-semibold flex items-center gap-2">
                Learn more <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <Building2 className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Become a Host Shop?</h2>
          <p className="text-xl text-white/80 mb-8">
            Join our network of approved host shops and help shape the next generation of beauty professionals.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/programs/barber-apprenticeship/host-shops/apply" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-4 px-10 rounded-lg transition text-lg">
              Apply as Host Shop
            </Link>
            <Link href="/contact" className="bg-white/10 hover:bg-white/20 text-white font-semibold py-4 px-10 rounded-lg transition border border-white/30 text-lg">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Student CTA */}
      <section className="py-12 px-6 bg-brand-green-50 border-t border-brand-green-200">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Are you a student looking for an apprenticeship?</h3>
          <p className="text-slate-600 mb-4">
            Visit our Apprenticeships page to find and apply for apprenticeship programs.
          </p>
          <Link href="/apprenticeships" className="inline-flex items-center gap-2 text-brand-blue-600 hover:underline font-semibold">
            View Apprenticeship Programs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

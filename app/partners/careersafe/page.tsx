import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import Link from 'next/link';

import {

  ExternalLink,
  Clock,
  Award,
  Users,
  Phone,
  Mail,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'CareerSafe OSHA Training | Short-Term Courses | Elevate For Humanity',
  description: 'OSHA 10 & OSHA 30 Safety Certification',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/partners/careersafe',
  },
};

export default async function CAREERSAFEPage() {
  const supabase = await createClient();

  
  // Fetch CareerSafe partner info
  const { data: partner } = await supabase
    .from('partners')
    .select('*')
    .eq('slug', 'careersafe')
    .single();
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Partners", href: "/partners" }, { label: "Careersafe" }]} />
      </div>
{/* Hero Section */}
      <section className="relative h-48 md:h-64 w-full overflow-hidden">
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-8 text-center">
            What You Get
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div className="text-black">
                Official OSHA certification cards
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div className="text-black">
                Required for many construction jobs
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div className="text-black">Self-paced online training</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div className="text-black">Lifetime access to materials</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div className="text-black">24/7 customer support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Available Courses */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-2xl md:text-3xl font-bold text-black mb-12 text-center text-2xl md:text-3xl lg:text-2xl md:text-3xl">
            Available Courses
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-brand-blue-500 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-black">
                  OSHA 10-Hour Construction
                </h3>
              </div>

              <div className="flex items-center gap-2 text-black mb-2">
                <Clock className="w-4 h-4" />
                <span>10 hours</span>
              </div>

              <div className="flex items-center gap-2 text-black mb-2">
                <Award className="w-4 h-4" />
                <span>OSHA 10 Card</span>
              </div>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-brand-blue-500 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-black">
                  OSHA 30-Hour Construction
                </h3>
              </div>

              <div className="flex items-center gap-2 text-black mb-2">
                <Clock className="w-4 h-4" />
                <span>30 hours</span>
              </div>

              <div className="flex items-center gap-2 text-black mb-2">
                <Award className="w-4 h-4" />
                <span>OSHA 30 Card</span>
              </div>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-brand-blue-500 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-black">
                  OSHA 10-Hour General Industry
                </h3>
              </div>

              <div className="flex items-center gap-2 text-black mb-2">
                <Clock className="w-4 h-4" />
                <span>10 hours</span>
              </div>

              <div className="flex items-center gap-2 text-black mb-2">
                <Award className="w-4 h-4" />
                <span>OSHA 10 Card</span>
              </div>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-brand-blue-500 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-black">
                  OSHA 30-Hour General Industry
                </h3>
              </div>

              <div className="flex items-center gap-2 text-black mb-2">
                <Clock className="w-4 h-4" />
                <span>30 hours</span>
              </div>

              <div className="flex items-center gap-2 text-black mb-2">
                <Award className="w-4 h-4" />
                <span>OSHA 30 Card</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-8 text-center">
            Need Help?
          </h2>
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="mb-6 pb-6 border-b border-slate-200">
              <div className="font-bold text-black mb-2">Mark Sattele</div>
              <div className="text-black mb-3">
                Postsecondary Account Executive
              </div>
              <div className="space-y-2">
                <a
                  href="mailto:Mark.Sattele@careersafeonline.com"
                  className="flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700"
                >
                  <Mail className="w-4 h-4" />
                  Mark.Sattele@careersafeonline.com
                </a>
                <a
                  href="tel:(216) 926-6536"
                  className="flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700"
                >
                  <Phone className="w-4 h-4" />
                  (216) 926-6536
                </a>
              </div>
            </div>

            <div className="text-center">
              <div className="text-black mb-2">Customer Care</div>
              <a
                href="tel:(888) 614-7233"
                className="text-2xl font-bold text-brand-blue-600 hover:text-brand-blue-700"
              >
                (888) 614-7233
              </a>
            </div>

            <div className="mt-6 text-center">
              <a
                href="https://www.careersafeonline.com/support"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700"
              >
                Visit Support Center
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-2xl md:text-3xl font-bold text-white mb-6 text-2xl md:text-3xl lg:text-2xl md:text-3xl">
            Ready to Get Started?
          </h2>
          <p className="text-base md:text-lg text-white mb-8">
            Enroll in CareerSafe OSHA Training courses through Elevate for
            Humanity
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://www.careersafeonline.com/campus/signin"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-10 py-5 bg-white text-brand-blue-600 text-xl font-bold rounded-full hover:bg-white transition-all hover:scale-105 shadow-2xl gap-2"
            >
              Get Started
              <ExternalLink className="w-6 h-6" />
            </a>

            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-10 py-5 bg-white/20 backdrop-blur-sm text-white text-xl font-bold rounded-full hover:bg-white/30 transition-all hover:scale-105 border-2 border-white/50 shadow-2xl"
            >
              Apply to Elevate
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

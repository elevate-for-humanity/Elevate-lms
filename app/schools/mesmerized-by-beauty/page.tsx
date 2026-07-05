import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Award, Clock, Users, ArrowRight, Phone, Mail } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import MesmerizedApplyForm from './MesmerizedApplyForm';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Mesmerized by Beauty Cosmetology Academy | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Apply to Cosmetology, Esthetician, or Nail Technician apprenticeship programs at Mesmerized by Beauty Cosmetology Academy in Indianapolis, IN. WIOA funding available.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/schools/mesmerized-by-beauty' },
  robots: { index: true, follow: true },
};

export const dynamic = 'force-dynamic';

const PROGRAMS = [
  {
    title: 'Cosmetology Apprenticeship',
    hours: '2,000 hours',
    credential: 'Indiana IPLA Cosmetology License',
    description: 'Full cosmetology training covering hair, skin, and nail services. Earn your Indiana state license while working alongside licensed professionals.',
    color: 'purple',
  },
  {
    title: 'Esthetician Apprenticeship',
    hours: '700 hours',
    credential: 'Indiana IPLA Esthetician License',
    description: 'Skin care, facials, waxing, and advanced esthetic techniques. Prepares you for licensure and employment in spas, salons, and medical settings.',
    color: 'fuchsia',
  },
  {
    title: 'Nail Technician Apprenticeship',
    hours: '400 hours',
    credential: 'Indiana IPLA Nail Technician License',
    description: 'Manicures, pedicures, nail enhancements, and sanitation standards. One of the fastest paths to a licensed beauty career in Indiana.',
    color: 'pink',
  },
];

export default async function MesmerizedByBeautyPage() {
  const supabase = await createClient();

  // Load live application count for social proof
  const { count: appCount } = await supabase
    .from('school_applications')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'approved');

  // Load partner record for contact info
  const { data: partner } = await supabase
    .from('partners')
    .select('contact_email, contact_phone, address, city, state, zip')
    .eq('name', 'Mesmerized by Beauty Cosmetology Academy')
    .maybeSingle();

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Schools', href: '/schools' },
            { label: 'Mesmerized by Beauty' },
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-900 via-purple-800 to-fuchsia-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <p className="text-purple-300 text-xs font-bold uppercase tracking-widest mb-3">
            Indianapolis, Indiana · IPLA Licensed Training Site
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6 leading-tight">
            Mesmerized by Beauty<br />Cosmetology Academy
          </h1>
          <p className="text-purple-100 text-lg max-w-2xl mb-8">
            Earn your Indiana cosmetology, esthetician, or nail technician license through a hands-on apprenticeship. WIOA and Workforce Ready Grant funding available — many students pay $0 out of pocket.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#apply" className="inline-flex items-center justify-center gap-2 bg-white text-purple-900 font-bold px-8 py-4 rounded-xl hover:bg-purple-50 transition text-lg">
              Apply Now <ArrowRight className="w-5 h-5" />
            </a>
            <a href="#programs" className="inline-flex items-center justify-center gap-2 border-2 border-white text-slate-900 font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition text-lg">
              View Programs
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-purple-50 border-y border-purple-100 py-8">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { label: 'Programs Offered', value: '3' },
            { label: 'Min. Training Hours', value: '400' },
            { label: 'State License', value: 'IPLA' },
            { label: 'Students Placed', value: appCount ? `${appCount}+` : 'Growing' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-purple-800">{s.value}</p>
              <p className="text-sm text-purple-600 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-3 text-center">Apprenticeship Programs</h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            All programs are state-approved apprenticeships. You earn while you learn, working alongside licensed professionals from day one.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {PROGRAMS.map((p) => (
              <div key={p.title} className="bg-white rounded-2xl border p-6 hover:shadow-lg transition">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <Award aria-label="award" className="w-6 h-6 text-purple-700" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{p.title}</h3>
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                  <Clock className="w-4 h-4" /> {p.hours}
                </div>
                <p className="text-slate-600 text-sm mb-4">{p.description}</p>
                <div className="bg-purple-50 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-purple-700">Credential: {p.credential}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funding */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Funding Options</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'WIOA', desc: 'Workforce Innovation and Opportunity Act — federally funded training for eligible adults and dislocated workers.' },
              { title: 'Workforce Ready Grant', desc: 'Indiana state grant covering tuition for high-demand occupations including cosmetology.' },
              { title: 'Employer Sponsored', desc: 'Some salons and spas sponsor apprentices. Ask about employer partnerships during your intake.' },
              { title: 'Self-Pay', desc: 'Flexible payment plans available. Contact us to discuss options.' },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl p-5 border">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <h3 className="font-bold text-slate-900">{f.title}</h3>
                </div>
                <p className="text-slate-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Apply Form */}
      <section id="apply" className="py-20">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Apply to Mesmerized by Beauty</h2>
            <p className="text-slate-600">Submit your application and we'll reach out within 2 business days to discuss your program options and funding eligibility.</p>
          </div>
          <MesmerizedApplyForm />
        </div>
      </section>

      {/* Contact */}
      <section className="bg-purple-900 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-6">Questions? Contact Us</h2>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            {partner?.contact_email && (
              <a href={`mailto:${partner.contact_email}`} className="inline-flex items-center gap-2 text-purple-200 hover:text-white transition">
                <Mail className="w-5 h-5" /> {partner.contact_email}
              </a>
            )}
            {partner?.contact_phone && (
              <a href={`tel:${partner.contact_phone}`} className="inline-flex items-center gap-2 text-purple-200 hover:text-white transition">
                <Phone className="w-5 h-5" /> {partner.contact_phone}
              </a>
            )}
            {!partner?.contact_email && !partner?.contact_phone && (
              <a href="mailto:mesmerizedbybeautyl@yahoo.com" className="inline-flex items-center gap-2 text-purple-200 hover:text-white transition">
                <Mail className="w-5 h-5" /> mesmerizedbybeautyl@yahoo.com
              </a>
            )}
          </div>
          {partner?.city && (
            <p className="text-purple-300 text-sm mt-4">{partner.city}, {partner.state} {partner.zip}</p>
          )}
        </div>
      </section>
    </div>
  );
}

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Heart, Users, GraduationCap, Briefcase, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Support Our Mission | Elevate for Humanity',
  description: 'Support workforce training for justice-involved individuals, low-income families, and veterans. Your contribution funds certifications, supplies, and career services.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/philanthropy' },
};

const impactAreas = [
  { icon: GraduationCap, title: 'Training & Certifications', desc: 'Fund tuition, exam fees, and certification costs for students who don\'t qualify for government funding.' },
  { icon: Briefcase, title: 'Tools & Supplies', desc: 'Provide welding equipment, HVAC tools, barber kits, medical supplies, and uniforms for hands-on training.' },
  { icon: Users, title: 'Support Services', desc: 'Cover transportation, childcare, and emergency assistance that keeps students in their programs.' },
  { icon: Heart, title: 'Career Services', desc: 'Fund resume workshops, interview coaching, job placement support, and employer networking events.' },
];

export default function PhilanthropyPage() {
  return (
    <div className="min-h-screen bg-white">      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Support Us' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] overflow-hidden">
        <Image src="/images/pages/philanthropy-hero.jpg" alt="Support workforce training" fill className="object-cover" priority sizes="100vw" />
        
      </section>

      {/* Mission */}
      <section className="py-14 sm:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Why Your Support Matters</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Elevate for Humanity provides workforce training to individuals facing barriers to employment — justice-involved individuals, low-income families, veterans, and career changers. While government funding (WIOA, WRG, JRI) covers many participants, not everyone qualifies.
          </p>
          <p className="text-slate-700 leading-relaxed">
            Your contribution directly funds training, supplies, and support services for students who would otherwise be unable to access career education. Every dollar goes toward putting someone on a path to stable employment and self-sufficiency.
          </p>
        </div>
      </section>

      {/* Impact Areas */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-10">Where Your Support Goes</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {impactAreas.map((area) => {
              const Icon = area.icon;
              return (
                <div key={area.title} className="bg-white rounded-xl p-6 border border-slate-200">
                  <Icon className="w-8 h-8 text-brand-red-600 mb-4" />
                  <h3 className="font-bold text-slate-900 text-lg mb-2">{area.title}</h3>
                  <p className="text-slate-600">{area.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How to Give */}
      <section className="py-14 sm:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-10">Ways to Support</h2>
          <div className="space-y-4">
            {[
              { title: 'Financial Contribution', desc: 'One-time or recurring donations fund training, supplies, and student support services.' },
              { title: 'Equipment & Supply Donations', desc: 'Donate tools, uniforms, medical supplies, or technology equipment for training programs.' },
              { title: 'Employer Partnership', desc: 'Hire our graduates, host apprentices, or sponsor a training cohort.' },
              { title: 'Volunteer', desc: 'Mentor students, lead workshops, or assist with career services events.' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4 p-5 bg-white rounded-xl border border-slate-200">
                <div className="w-2 h-2 rounded-full bg-white mt-2.5 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-slate-900">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Heart className="w-10 h-10 text-white/80 mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Make a Difference Today</h2>
          <p className="text-xl text-white/90 mb-10">Contact us to discuss how you can support workforce training in Indianapolis.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 bg-white text-brand-red-600 px-10 py-5 rounded-full font-bold text-xl hover:bg-white transition hover:scale-105 shadow-lg">
            Contact Us <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

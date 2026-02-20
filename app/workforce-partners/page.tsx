export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Users, MapPin, Phone, ArrowRight, Handshake, Award, FileText } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
export const metadata: Metadata = {
  title: 'Workforce Partners | WorkOne & Community Organizations | Elevate For Humanity',
  description: 'Partner with Elevate for Humanity to connect job seekers with free career training. WorkOne centers, community organizations, and workforce boards - learn how we work together.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/workforce-partners' },
};



export default async function WorkforcePartnersPage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('programs').select('*').limit(50);
const partners = (dbRows as any[]) || [];
const services = (dbRows as any[]) || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'Workforce Partners' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px]">
        <Image src="/images/heroes/workforce-partner-1.jpg" alt="Workforce development partners" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
              <Handshake className="w-4 h-4" /> Partner Network
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              Workforce Partners
            </h1>
            <p className="text-xl text-white/90 max-w-xl mb-6">
              We work with WorkOne centers, workforce boards, and community organizations to connect Hoosiers with free career training.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/contact" className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-full font-bold transition-all hover:scale-105">
                Become a Partner <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/workone-partner-packet" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-full font-bold transition-all border border-white/40">
                Partner Resources
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How We Work Together */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black text-center mb-4">How We Work Together</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Elevate for Humanity is an approved training provider on Indiana's Eligible Training Provider List (ETPL). Here's how we partner with workforce organizations.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-center">
                <div className="w-14 h-14 bg-brand-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <service.icon className="w-7 h-7 text-brand-blue-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{service.title}</h3>
                <p className="text-slate-600 text-sm">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Partners */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black text-center mb-4">Our Partners</h2>
          <p className="text-center text-slate-600 mb-12">Organizations we work with to serve Indiana job seekers</p>
          <div className="grid md:grid-cols-2 gap-8">
            {partners.map((partner, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
                <div className="relative h-48">
                  <Image src={partner.image} alt={partner.name} fill sizes="100vw" className="object-cover" />
                  <div className="absolute top-4 left-4">
                    <span className="bg-brand-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">{partner.type}</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{partner.name}</h3>
                  <p className="text-slate-600 text-sm mb-4">{partner.description}</p>
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <MapPin className="w-4 h-4" />
                    {partner.location}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For WorkOne Staff */}
      <section className="py-16 bg-brand-blue-600">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-3xl font-black mb-6">For WorkOne Staff</h2>
              <p className="text-brand-blue-100 mb-6">
                Career advisors and case managers: We've created resources specifically for you to help your clients access our training programs.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'Program fact sheets and eligibility requirements',
                  'ITA request forms and processing guides',
                  'Direct contact for student referrals',
                  'Real-time enrollment and progress updates',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/workone-partner-packet" className="inline-flex items-center gap-2 bg-white text-brand-blue-600 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-all">
                Access Partner Packet <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="relative h-80 rounded-2xl overflow-hidden shadow-2xl">
              <Image src="/images/heroes/workforce-partner-5.jpg" alt="WorkOne career advisor" fill sizes="100vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ETPL Information */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-slate-50 rounded-2xl p-8 md:p-12">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-900 mb-4">ETPL Approved Provider</h2>
                <p className="text-slate-600 mb-4">
                  Elevate for Humanity is listed on Indiana's Eligible Training Provider List (ETPL), which means our programs are approved for WIOA funding.
                </p>
                <p className="text-slate-600 mb-6">
                  Job seekers can use Individual Training Accounts (ITAs) to enroll in our programs at no cost to them.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/programs" className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition-colors">
                    View Approved Programs
                  </Link>
                  <a href="https://www.in.gov/dwd/career-training-adult-ed/intraining/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-semibold hover:bg-slate-100 transition-colors">
                    View ETPL List
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Programs', value: '15+' },
                  { label: 'Credentials', value: '25+' },
                  { label: 'Completion Rate', value: '89%' },
                  { label: 'Job Placement', value: '85%' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-xl p-6 text-center shadow-sm">
                    <div className="text-3xl font-black text-brand-blue-600 mb-1">{stat.value}</div>
                    <div className="text-slate-600 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-white mb-4">Partner With Us</h2>
          <p className="text-xl text-slate-300 mb-8">
            Let's work together to connect more Hoosiers with career training and employment.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contact" className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-8 py-4 rounded-full font-bold transition-all hover:scale-105">
              Contact Us <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="/support" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-bold transition-all border border-white/30">
              <Phone className="w-5 h-5" /> Get Help Online
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

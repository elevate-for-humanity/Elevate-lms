export const dynamic = 'force-dynamic';

import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { Building2, Briefcase, GraduationCap, Handshake, Award } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createPublicClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Our Partners | Elevate for Humanity',
  description: 'Elevate for Humanity partners with workforce boards, employers, training providers, and government agencies to deliver free career training in Indianapolis.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/about/partners',
  },
};

export default async function PartnersPage() {
  const supabase = createPublicClient();

  // Fetch partners by type
  const { data: allPartners } = await supabase
    .from('partners')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  const partners = allPartners || [];
  
  const governmentPartners = partners.filter(p => p.partner_type === 'government');
  const certificationPartners = partners.filter(p => p.partner_type === 'certification');
  const trainingPartners = partners.filter(p => p.partner_type === 'training');
  const employerPartners = partners.filter(p => p.partner_type === 'employer');
  const workforcePartners = partners.filter(p => p.partner_type === 'workforce');

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'About', href: '/about' }, { label: 'Partners' }]} />
        </div>
      </div>
      
      {/* Hero Section */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/heroes/workforce-partner-1.jpg" alt="Partners background" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Our Partners</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">We collaborate with government agencies, employers, and training providers to deliver free, funded career training.</p>
          </div>
        </div>
      </section>

      {/* Government Partners */}
      {(governmentPartners.length > 0 || workforcePartners.length > 0) && (
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <Building2 className="w-8 h-8 text-brand-blue-600" />
              <h2 className="text-3xl font-bold text-slate-900">Government & Workforce Partners</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...governmentPartners, ...workforcePartners].map((partner: any) => (
                <div key={partner.id} className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition">
                  {partner.logo_url && (
                    <div className="h-16 flex items-center justify-center mb-4">
                      <Image
                        src={partner.logo_url}
                        alt={partner.name}
                        width={120}
                        height={60}
                        className="object-contain"
                      />
                    </div>
                  )}
                  <h3 className="font-semibold text-slate-900 mb-2">{partner.name}</h3>
                  {partner.description && (
                    <p className="text-sm text-slate-600">{partner.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Certification Partners */}
      {certificationPartners.length > 0 && (
        <section className="py-16 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <Award className="w-8 h-8 text-brand-green-600" />
              <h2 className="text-3xl font-bold text-slate-900">Certification Partners</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificationPartners.map((partner: any) => (
                <div key={partner.id} className="bg-white border rounded-xl p-6 shadow-sm">
                  {partner.logo_url && (
                    <div className="h-16 flex items-center justify-center mb-4">
                      <Image
                        src={partner.logo_url}
                        alt={partner.name}
                        width={120}
                        height={60}
                        className="object-contain"
                      />
                    </div>
                  )}
                  <h3 className="font-semibold text-slate-900 mb-2">{partner.name}</h3>
                  {partner.description && (
                    <p className="text-sm text-slate-600">{partner.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Training Partners */}
      {trainingPartners.length > 0 && (
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <GraduationCap className="w-8 h-8 text-brand-blue-600" />
              <h2 className="text-3xl font-bold text-slate-900">Training Partners</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainingPartners.map((partner: any) => (
                <div key={partner.id} className="bg-white border rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-slate-900 mb-2">{partner.name}</h3>
                  {partner.description && (
                    <p className="text-sm text-slate-600 mb-3">{partner.description}</p>
                  )}
                  {partner.website_url && (
                    <a href={partner.website_url} target="_blank" rel="noopener noreferrer" className="text-brand-blue-600 text-sm hover:underline">
                      Visit Website
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Employer Partners */}
      {employerPartners.length > 0 && (
        <section className="py-16 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <Briefcase className="w-8 h-8 text-brand-orange-600" />
              <h2 className="text-3xl font-bold text-slate-900">Employer Partners</h2>
            </div>
            <p className="text-slate-600 mb-8">
              Our graduates are hired by leading employers across healthcare, skilled trades, and professional services.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {employerPartners.map((partner: any) => (
                <div key={partner.id} className="bg-white border rounded-lg p-4 text-center">
                  <p className="font-medium text-slate-700 text-sm">{partner.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-brand-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Handshake className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">Become a Partner</h2>
          <p className="text-xl text-brand-blue-100 mb-8">
            Join our network of employers, training providers, and workforce organizations.
          </p>
          <Link
            href="/contact?subject=Partnership%20Inquiry"
            className="inline-flex items-center gap-2 bg-white text-brand-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-50 transition"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}

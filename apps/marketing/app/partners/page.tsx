import { Metadata } from 'next';
import Link from 'next/link';
import { Building2, Users, GraduationCap, Handshake, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Partners',
  description: 'Partner with Elevate for Humanity. Employers, training providers, workforce agencies, and host shops.',
};

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-purple-900 to-purple-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Partner With Us</h1>
          <p className="text-xl text-purple-100">Join our ecosystem of employers, training providers, workforce agencies, and host shops.</p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <Building2 className="w-12 h-12 text-purple-600 mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-3">For Employers</h2>
              <p className="text-slate-600 mb-4">Build your talent pipeline, access tax credits, and partner with apprenticeship programs.</p>
              <Link href="/for-employers" className="text-purple-600 font-semibold hover:underline flex items-center gap-1">Learn More <ArrowRight className="w-4 h-4" /></Link>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <Users className="w-12 h-12 text-purple-600 mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-3">For Workforce Agencies</h2>
              <p className="text-slate-600 mb-4">Connect your participants to ETPL-approved training and apprenticeship programs.</p>
              <Link href="/for-agencies" className="text-purple-600 font-semibold hover:underline flex items-center gap-1">Learn More <ArrowRight className="w-4 h-4" /></Link>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <GraduationCap className="w-12 h-12 text-purple-600 mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-3">For Training Providers</h2>
              <p className="text-slate-600 mb-4">Licensing and partnership opportunities for training providers and schools.</p>
              <Link href="/for-providers" className="text-purple-600 font-semibold hover:underline flex items-center gap-1">Learn More <ArrowRight className="w-4 h-4" /></Link>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <Handshake className="w-12 h-12 text-purple-600 mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Host Shops</h2>
              <p className="text-slate-600 mb-4">Become a host shop for barber, cosmetology, or esthetician apprentices.</p>
              <Link href="/partners/host-shops" className="text-purple-600 font-semibold hover:underline flex items-center gap-1">Learn More <ArrowRight className="w-4 h-4" /></Link>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-purple-900 text-white text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Partner?</h2>
        <Link href="/contact" className="bg-white text-purple-900 font-bold py-3 px-8 rounded-lg hover:bg-purple-100">Contact Us</Link>
      </section>
    </div>
  );
}

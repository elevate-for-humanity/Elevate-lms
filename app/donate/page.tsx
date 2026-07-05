import { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { Heart, Users, GraduationCap, Building } from 'lucide-react';

export const metadata: Metadata = {
  title: `Donate | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Support workforce development. Your donation helps remove barriers to career training for those who need it most.',
};

export default function DonatePage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-slate-900 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Heart className="w-16 h-16 text-brand-red-500 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Make a Difference</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Your support helps remove barriers to career training
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Why Donate?</h2>
          <p className="text-slate-600">
            Every dollar helps someone access workforce training who otherwise couldn't afford it.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: GraduationCap, title: 'Support Students', desc: 'Help cover costs for students without funding' },
            { icon: Building, title: 'Expand Programs', desc: 'Fund new training programs in high-demand fields' },
            { icon: Users, title: 'Build Community', desc: 'Strengthen the workforce in our community' },
          ].map((item) => (
            <div key={item.title} className="text-center p-8 bg-slate-50 rounded-xl">
              <item.icon className="w-10 h-10 text-brand-red-600 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-slate-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 bg-slate-50 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Contact Us to Donate</h2>
          <p className="text-slate-600 mb-8">We'd love to discuss partnership opportunities with you.</p>
          <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold rounded-xl transition-colors">
            Get in Touch
          </Link>
        </div>
      </section>
    </div>
  );
}

import { Metadata } from 'next';
import Link from 'next/link';
import { Building2, GraduationCap, Users, Heart, Phone, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Apply for Partnership | Elevate for Humanity',
  description: 'Apply to become an Elevate partner. Join employers, training providers, and community organizations building workforce solutions.',
};

const partnershipOptions = [
  { icon: Building2, title: 'Employer Partnership', desc: 'Hire graduates, sponsor apprenticeships, or participate in OJT reimbursement.', href: '/apply/employer' },
  { icon: GraduationCap, title: 'Training Provider', desc: 'Join our network of credentialed training providers.', href: '/apply/program-holder' },
  { icon: Users, title: 'Host Shop', desc: 'Host beauty apprentices in your salon, barbershop, spa, or nail salon.', href: '/partners/host-shop/apply' },
  { icon: Heart, title: 'Community Partner', desc: 'Refer participants from your organization or community group.', href: '/contact' },
];

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium">Partnership Application</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Apply to Partner with Elevate</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Choose the partnership type that matches your organization. Each option routes to the canonical application for that role so your submission, acknowledgment, review, and onboarding stay in one workflow.</p>
        </div>
      </section>
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Select Partnership Type</h2>
              <div className="space-y-4">
                {partnershipOptions.map((option, i) => {
                  const Icon = option.icon;
                  return (
                    <Link key={i} href={option.href} className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl hover:border-brand-blue-600 hover:bg-brand-blue-50 transition-colors">
                      <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-brand-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{option.title}</h3>
                        <p className="text-slate-600 text-sm">{option.desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Application Process</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">1</div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Submit Application</h4>
                    <p className="text-slate-600 text-sm">Complete the application for your partnership type and receive a reference/receipt.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">2</div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Review &amp; Verification</h4>
                    <p className="text-slate-600 text-sm">Elevate reviews the application and any required business, credential, or compliance documentation.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">3</div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Onboarding</h4>
                    <p className="text-slate-600 text-sm">You receive the role-specific agreements, portal access, and exact next steps required for approval.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">4</div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Operate in the Portal</h4>
                    <p className="text-slate-600 text-sm">Approved partners use the correct portal for apprentices, participants, programs, documents, and reporting.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-brand-blue-700 rounded-2xl p-8 md:p-12 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Questions About Partnering?</h2>
            <p className="text-blue-100 mb-6 max-w-xl mx-auto">Our partnership team is here to help you find the right collaboration model.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:+13173143757" className="inline-flex items-center gap-2 bg-white text-brand-blue-700 font-bold py-3 px-8 rounded-lg hover:bg-blue-50 transition-colors">
                <Phone className="w-5 h-5" /> (317) 314-3757
              </a>
              <a href="mailto:partnerships@elevateforhumanity.org" className="inline-flex items-center gap-2 bg-white/20 text-white font-bold py-3 px-8 rounded-lg hover:bg-white/30 transition-colors">
                <Mail className="w-5 h-5" /> Email Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

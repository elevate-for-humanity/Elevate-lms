import { Metadata } from 'next';
import Link from 'next/link';
import { Building2, GraduationCap, Users, Heart, Phone, Mail, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Apply for Partnership | Elevate for Humanity',
  description: 'Apply to become an Elevate partner. Join employers, training providers, and community organizations building workforce solutions.',
};

const partnershipOptions = [
  { icon: Building2, title: 'Employer Partnership', desc: 'Hire graduates, sponsor apprenticeships, or participate in OJT reimbursement.', href: '/onboarding/employer' },
  { icon: GraduationCap, title: 'Training Provider', desc: 'Join our network of credentialed training providers.', href: '/onboarding/provider' },
  { icon: Users, title: 'Host Shop', desc: 'Host beauty apprentices in your salon or barbershop.', href: '/partners/barber-host-shop/apply' },
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
          <p className="text-xl text-blue-100 max-w-2xl">Complete our partner application to join the Elevate network. We'll review your application and contact you within 2-3 business days.</p>
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
                    <p className="text-slate-600 text-sm">Complete the application form for your partnership type.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">2</div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Review Period</h4>
                    <p className="text-slate-600 text-sm">Our team reviews your application within 2-3 business days.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">3</div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Onboarding Call</h4>
                    <p className="text-slate-600 text-sm">We'll schedule a call to discuss next steps and answer questions.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">4</div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Get Started</h4>
                    <p className="text-slate-600 text-sm">Access your partner portal and start connecting with students.</p>
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

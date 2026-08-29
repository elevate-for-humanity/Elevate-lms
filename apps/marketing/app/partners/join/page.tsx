import { Metadata } from 'next';
import Link from 'next/link';
import { Users, Building2, GraduationCap, Briefcase, Heart, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Join Our Partner Network,
  description: 'Partner with Elevate to transform workforce development in your community. Join employers, training providers, and community organizations.',
};

const partnerTypes = [
  { icon: Building2, title: 'Employer', desc: 'Hire trained graduates, sponsor apprenticeships, or offer on-the-job training.', href: '/employer' },
  { icon: GraduationCap, title: 'Training Provider', desc: 'Join our network of credentialed providers to expand your reach.', href: '/partners/training-provider' },
  { icon: Heart, title: 'Community Organization', desc: 'Refer participants and help underserved populations access training.', href: '/partners/reentry' },
  { icon: Briefcase, title: 'Host Shop', desc: 'Host apprentices in your salon or barbershop and build your team.', href: '/partners/host-shops' },
];

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium">Partner With Us</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Join Our Partner Network</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Partner with Elevate to transform workforce development in your community. Together, we can help more people access life-changing career training.</p>
        </div>
      </section>
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Choose Your Partnership Type</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {partnerTypes.map((type, i) => {
              const Icon = type.icon;
              return (
                <Link key={i} href={type.href} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-brand-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-7 h-7 text-brand-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                        {type.title}
                        <ArrowRight className="w-5 h-5 text-brand-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-slate-600">{type.desc}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm mb-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Why Partner With Elevate?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-blue-600 mb-2">2,500+</div>
                <p className="text-slate-600">Students Trained</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-blue-600 mb-2">150+</div>
                <p className="text-slate-600">Employer Partners</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-blue-600 mb-2">85%</div>
                <p className="text-slate-600">Job Placement Rate</p>
              </div>
            </div>
          </div>
          
          <div className="bg-brand-blue-700 rounded-2xl p-8 md:p-12 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-blue-100 mb-6 max-w-xl mx-auto">Contact our partnership team to discuss how we can work together to build a stronger workforce in your community.</p>
            <Link href="/contact" className="inline-flex items-center gap-2 bg-white text-brand-blue-700 font-bold py-3 px-8 rounded-lg hover:bg-blue-50 transition-colors">
              Contact Partnership Team <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

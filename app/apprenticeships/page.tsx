import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Clock, DollarSign, GraduationCap, Shield, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Registered Apprenticeships | Earn While You Learn | Elevate for Humanity',
  description: 'DOL-registered apprenticeship programs in barbering, cosmetology, and esthetics. Earn wages while learning your trade with no tuition upfront.',
  keywords: ['registered apprenticeship', 'DOL apprenticeship', 'earn while you learn', 'barber apprenticeship', 'cosmetology apprenticeship', 'paid training'],
  openGraph: {
    title: 'Registered Apprenticeships | Elevate for Humanity',
    description: 'Earn wages while learning your trade. DOL-registered apprenticeship programs with no tuition upfront.',
    type: 'website',
  },
};

const APPRENTICESHIPS = [
  { slug: 'barber-apprenticeship', title: 'Barber Apprenticeship', duration: '52 weeks', credential: 'Indiana Barber License', salary: '$35,000-$55,000/yr', highlight: 'Most Popular', description: 'Learn classic and modern cutting techniques while earning at partner barbershops.', features: ['Paid on-the-job training', 'No tuition upfront', 'State license prep', '1-on-1 mentorship'] },
  { slug: 'cosmetology-apprenticeship', title: 'Cosmetology Apprenticeship', duration: '52 weeks', credential: 'Indiana Cosmetology License', salary: '$30,000-$50,000/yr', description: 'Master hair, makeup, and nail techniques at partner salons.', features: ['Paid training', 'Flexible schedule', 'Industry certifications', 'Job placement'] },
  { slug: 'esthetician-apprenticeship', title: 'Esthetician Apprenticeship', duration: '36 weeks', credential: 'Indiana Esthetician License', salary: '$28,000-$45,000/yr', description: 'Learn skincare, facials, and advanced treatments at partner spas.', features: ['Hands-on training', 'Skincare expertise', 'Spa environment', 'Growing demand'] },
];

const BENEFITS = [
  { icon: DollarSign, title: 'Earn While You Learn', description: 'Get paid for on-the-job training while earning credentials.' },
  { icon: GraduationCap, title: 'No Tuition Upfront', description: 'Most apprentices pay $0 through workforce funding.' },
  { icon: Shield, title: 'DOL-Registered', description: 'Nationally recognized credentials employers trust.' },
  { icon: Users, title: '1-on-1 Mentorship', description: 'Learn from experienced professionals.' },
  { icon: Clock, title: 'Flexible Schedule', description: 'Evening and weekend options available.' },
  { icon: CheckCircle, title: 'Job Placement', description: 'Access to employer network for career placement.' },
];

export default function ApprenticeshipsPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-brand-red-600 to-brand-red-700 text-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              DOL-Registered Apprenticeship Sponsor
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6">Registered Apprenticeships</h1>
            <p className="text-xl text-red-100 mb-8">Earn wages while you learn your trade. Our DOL-registered apprenticeship programs combine paid on-the-job training with classroom instruction—no tuition upfront for qualifying students.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/apply" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors">Apply Now - Free <ArrowRight className="w-5 h-5" /></Link>
              <Link href="/eligibility" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-colors">Check Funding Eligibility</Link>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-slate-50 border-b border-slate-200 py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-slate-600"><CheckCircle className="w-5 h-5 text-green-600" /><span className="font-medium">DOL Registered Sponsor</span></div>
            <div className="flex items-center gap-2 text-slate-600"><CheckCircle className="w-5 h-5 text-green-600" /><span className="font-medium">WIOA Approved</span></div>
            <div className="flex items-center gap-2 text-slate-600"><CheckCircle className="w-5 h-5 text-green-600" /><span className="font-medium">ETPL Listed</span></div>
            <div className="flex items-center gap-2 text-slate-600"><CheckCircle className="w-5 h-5 text-green-600" /><span className="font-medium">98% License Pass Rate</span></div>
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">How Apprenticeship Works</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">A registered apprenticeship is a proven pathway to a rewarding career. You work, learn, and earn—all at the same time.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><span className="text-2xl font-extrabold text-brand-red-600">1</span></div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Apply & Get Matched</h3>
              <p className="text-slate-600">Submit your application. We match you with an employer partner and identify funding you qualify for.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><span className="text-2xl font-extrabold text-brand-red-600">2</span></div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Earn & Learn</h3>
              <p className="text-slate-600">Start working at your host shop immediately. Earn wages while completing your training hours.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><span className="text-2xl font-extrabold text-brand-red-600">3</span></div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Graduate & Succeed</h3>
              <p className="text-slate-600">Pass your state exam, earn your license, and launch your career with our employer network.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Our Apprenticeship Programs</h2>
            <p className="text-lg text-slate-600">Choose the path that fits your career goals.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {APPRENTICESHIPS.map((program) => (
              <div key={program.slug} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow">
                {program.highlight && <div className="bg-brand-red-600 text-white text-center py-2 text-sm font-semibold">{program.highlight}</div>}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{program.title}</h3>
                  <p className="text-slate-600 mb-4">{program.description}</p>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-slate-600"><Clock className="w-4 h-4 text-slate-400" /><span>{program.duration}</span></div>
                    <div className="flex items-center gap-2 text-sm text-slate-600"><GraduationCap className="w-4 h-4 text-slate-400" /><span>{program.credential}</span></div>
                    <div className="flex items-center gap-2 text-sm text-green-600 font-medium"><DollarSign className="w-4 h-4" /><span>{program.salary}</span></div>
                  </div>
                  <div className="space-y-2 mb-6">
                    {program.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle className="w-4 h-4 text-green-500" /><span>{feature}</span></div>
                    ))}
                  </div>
                  <Link href={`/programs/${program.slug}`} className="block w-full py-3 bg-brand-red-600 text-white text-center font-semibold rounded-xl hover:bg-brand-red-700 transition-colors">Learn More</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Why Choose an Apprenticeship?</h2>
            <p className="text-lg text-slate-600">Unlike traditional schooling, you earn while you learn.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <div key={i} className="bg-white rounded-xl p-6 border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-brand-red-100 rounded-xl flex items-center justify-center mb-4 text-brand-red-600"><Icon className="w-6 h-6" /></div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{benefit.title}</h3>
                  <p className="text-slate-600">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold mb-4">Most Apprentices Pay $0 for Training</h2>
          <p className="text-xl text-slate-300 mb-8">Through WIOA and other workforce funding programs, most of our apprentices complete their training at no upfront cost.</p>
          <Link href="/eligibility" className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors">Check Your Eligibility - Free <ArrowRight className="w-5 h-5" /></Link>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Ready to Start Your Career?</h2>
          <p className="text-lg text-slate-600 mb-8">Join thousands of graduates who launched successful careers through our paid apprenticeship programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors">Apply Now <ArrowRight className="w-5 h-5" /></Link>
            <Link href="/programs" className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:border-brand-red-600 hover:text-brand-red-600 transition-colors">View All Programs</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

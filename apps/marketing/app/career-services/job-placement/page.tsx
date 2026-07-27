import { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, Users, Target, CheckCircle, TrendingUp, Phone, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Job Placement Services | Career Services',
  keywords: ["job placement", "career services", "employment assistance", "job search"],
  description: 'Get help finding your perfect job. Our career services team connects graduates with employers and provides ongoing employment support.',
};

export default function JobPlacementPage() {
  const services = [
    { icon: Target, title: 'Resume Optimization', desc: 'ATS-friendly resumes that get past screening and catch recruiter attention.' },
    { icon: Users, title: 'Employer Connections', desc: 'Direct connections to our network of 200+ employer partners actively hiring.' },
    { icon: Briefcase, title: 'Interview Prep', desc: 'Mock interviews, feedback, and coaching to help you ace every interview.' },
    { icon: TrendingUp, title: 'Career Coaching', desc: 'Ongoing support for salary negotiation, career progression, and job changes.' },
  ];

  const stats = [
    { value: '85%', label: 'Placement Rate' },
    { value: '200+', label: 'Employer Partners' },
    { value: '1000+', label: 'Graduates Placed' },
    { value: '30 days', label: 'Avg. Time to Hire' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-brand-blue-800 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-red-500 to-brand-orange-500" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-brand-red-500/20 text-brand-red-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Briefcase className="w-4 h-4" />
              Career Services
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Job Placement Services
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              We don't just train you — we help you get hired. Our career services team works with you from graduation to your first day on the job.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/career-services/contact" className="inline-flex items-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                Get Placement Help
              </Link>
              <a href="tel:3173143757" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-brand-blue-900 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                <Phone className="w-4 h-4 mr-2" />
                Call (317) 314-3757
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-3xl md:text-4xl font-black text-brand-blue-600 mb-1">{s.value}</div>
                <div className="text-sm text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-4">How We Help You Get Hired</h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">Comprehensive support from graduation to your first day on the job.</p>
          <div className="grid sm:grid-cols-2 gap-6">
            {services.map((s) => (
              <div key={s.title} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <s.icon className="w-8 h-8 text-brand-blue-600 mb-4" />
                <h3 className="font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Employer Network */}
      <section className="py-16 bg-brand-blue-50 border-y border-brand-blue-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-4">Our Employer Network</h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">Graduates have access to our growing network of employer partners.</p>
          <div className="grid sm:grid-cols-3 md:grid-cols-4 gap-4">
            {['Healthcare Plus', 'Cool Air Solutions', 'Midwest Logistics', 'Elevate Salon', 'Community Pharmacy', 'Local Hospitals', 'Retail Chains', 'Manufacturing'].map((company) => (
              <div key={company} className="bg-white rounded-lg p-4 text-center border border-slate-200">
                <p className="text-sm font-medium text-slate-700">{company}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-slate-500 mt-6">And 190+ more employers actively hiring our graduates</p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-12">Success Stories</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Maria G.', program: 'Medical Assistant', story: 'The career team helped me land a job at a top hospital within 2 weeks of graduating.', outcome: 'Now working at Community Hospital' },
              { name: 'James T.', program: 'HVAC Technician', story: 'They connected me with an employer who was hiring immediately. Best decision I made.', outcome: 'Started at $22/hr with benefits' },
              { name: 'Keisha R.', program: 'Barber Apprenticeship', story: 'The interview prep was incredible. I felt so confident going into every interview.', outcome: 'Now employed at Elevate Salon' },
            ].map((t) => (
              <div key={t.name} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-brand-blue-600">{t.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.program}</p>
                  </div>
                </div>
                <p className="text-slate-700 italic mb-4">"{t.story}"</p>
                <p className="text-xs text-brand-blue-600 font-medium">{t.outcome}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Start Your Career?</h2>
          <p className="text-slate-400 mb-8">Our career services team is here to help you find your perfect job.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/career-services/contact" className="inline-flex items-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Contact Career Services <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link href="/programs" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-slate-900 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Browse Training Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

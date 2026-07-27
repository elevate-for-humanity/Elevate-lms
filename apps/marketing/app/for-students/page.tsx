import { Metadata } from 'next';
import Link from 'next/link';
import { GraduationCap, Briefcase, DollarSign, Users, ArrowRight, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'For Students | Elevate for Humanity',
  description: 'Resources and support for students pursuing workforce training and career development.',
};

const steps = [
  { n: '1', title: 'Apply Online', desc: 'Complete our quick application form to get started' },
  { n: '2', title: 'Interview & Assessment', desc: 'Meet with an advisor and explore your career options' },
  { n: '3', title: 'Funding Consultation', desc: 'We help you find funding options to cover costs' },
  { n: '4', title: 'Enroll in Training', desc: 'Start your program with all the support you need' },
  { n: '5', title: 'Earn Your Credential', desc: 'Complete coursework and earn industry certification' },
  { n: '6', title: 'Career Placement', desc: 'Get connected to employers seeking skilled workers' },
];

const categories = [
  { label: 'Healthcare', href: '/programs/healthcare', icon: '🏥' },
  { label: 'Skilled Trades', href: '/programs/skilled-trades', icon: '🔧' },
  { label: 'CDL Training', href: '/programs/cdl-training', icon: '🚚' },
  { label: 'Cosmetology & Barbering', href: '/programs/cosmetology-apprenticeship', icon: '✂️' },
  { label: 'Apprenticeships', href: '/apprenticeships', icon: '📚' },
  { label: 'View All Programs', href: '/programs', icon: '→' },
];

const funding = [
  { label: 'WIOA', desc: 'Workforce Innovation & Opportunity Act — federal funding for eligible participants.' },
  { label: 'Workforce Ready Grant', desc: 'Indiana state-funded training support for high-demand careers.' },
  { label: 'FSSA Programs', desc: 'TANF and support services for eligible participants.' },
];

const benefits = [
  { icon: GraduationCap, title: 'Industry Certifications', desc: 'Earn credentials recognized by employers nationwide' },
  { icon: Briefcase, title: 'Career Support', desc: 'Job placement assistance and interview preparation' },
  { icon: DollarSign, title: 'Financial Assistance', desc: 'Grants and scholarships to cover training costs' },
  { icon: Users, title: 'Personalized Advising', desc: 'One-on-one support throughout your journey' },
];

export default function ForStudentsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium">Student Resources</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">For Students</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Your gateway to learning and career support. Start your journey to a rewarding career today.</p>
        </div>
      </section>
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Your Path to Success</h2>
            <p className="text-xl text-slate-600">Follow these steps to start your career training journey</p>
          </div>
          
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6 mb-16">
            {steps.map((step, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm text-center relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {step.n}
                </div>
                <div className="pt-4">
                  <h4 className="font-semibold text-slate-900 mb-2">{step.title}</h4>
                  <p className="text-slate-600 text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mb-12">
            <Link href="/apply" className="inline-flex items-center gap-2 bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700 transition-colors">
              Start Your Application <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm mb-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Explore Programs</h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((cat, i) => (
                <Link key={i} href={cat.href} className="flex flex-col items-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-center">
                  <span className="text-3xl mb-2">{cat.icon}</span>
                  <span className="font-medium text-slate-900 text-sm">{cat.label}</span>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {benefits.map((benefit, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                <benefit.icon className="w-10 h-10 text-brand-blue-600 mb-4" />
                <h4 className="font-bold text-slate-900 mb-2">{benefit.title}</h4>
                <p className="text-slate-600 text-sm">{benefit.desc}</p>
              </div>
            ))}
          </div>
          
          <div className="bg-brand-blue-700 rounded-2xl p-8 md:p-12 text-white mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">Funding Options</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {funding.map((item, i) => (
                <div key={i} className="bg-white/10 rounded-xl p-6">
                  <h4 className="font-bold text-lg mb-2">{item.label}</h4>
                  <p className="text-blue-100 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/check-eligibility" className="inline-flex items-center gap-2 bg-white text-brand-blue-700 font-bold py-3 px-8 rounded-lg hover:bg-blue-50 transition-colors">
                Check Your Eligibility <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
          
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Ready to Get Started?</h3>
            <p className="text-slate-600 mb-6">Join thousands of students who have transformed their careers with Elevate.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/apply" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700 transition-colors">
                Apply Now
              </Link>
              <Link href="/contact" className="bg-white text-brand-blue-600 border-2 border-brand-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-50 transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


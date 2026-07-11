export const dynamic = 'force-static';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Shield, Clock, Award, CheckCircle, Calendar, Users, CreditCard, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Testing Center | Elevate Store',
  description: 'Schedule certification exams, manage proctors, track scores, and issue credentials. ACT WorkKeys, Certiport, EPA, CPR, and more.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/testing',
  },
};

const exams = [
  { name: 'ACT WorkKeys', desc: 'NCRC assessments for workforce readiness', price: '$40', providers: ['ACT'] },
  { name: 'Certiport', desc: 'Microsoft, Adobe, Autodesk certifications', price: '$120', providers: ['Certiport'] },
  { name: 'EPA 608', desc: 'HVAC refrigerant handling certification', price: '$75', providers: ['EPA'] },
  { name: 'NHA Certifications', desc: 'CPhT, CCMA, Phlebotomy technician', price: '$145', providers: ['NHA'] },
  { name: 'CPR/AED', desc: 'American Heart Association certification', price: '$60', providers: ['AHA'] },
  { name: 'CareerSafe', desc: 'OSHA-10 and OSHA-30 safety training', price: '$80', providers: ['OSHA'] },
];

const features = [
  { icon: Calendar, title: 'Online Scheduling', desc: 'Students book exams 24/7' },
  { icon: Users, title: 'Proctor Management', desc: 'Remote and in-person proctors' },
  { icon: Award, title: 'Credential Issuance', desc: 'Digital certificates auto-issued' },
  { icon: Shield, title: 'Secure Testing', desc: 'Remote proctoring with AI monitoring' },
  { icon: CreditCard, title: 'Integrated Payments', desc: 'Stripe checkout included' },
  { icon: CheckCircle, title: 'Score Tracking', desc: 'Real-time results dashboard' },
];

export default function TestingCenterPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Testing Center" }]} />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-red-900 via-red-800 to-slate-900">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-20 w-72 h-72 bg-red-500 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-yellow-500 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full text-sm font-bold mb-6">
                <Shield className="w-4 h-4" />
                Testing Center
              </div>
              
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
                Certification Testing <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">Made Simple</span>
              </h1>
              
              <p className="text-xl text-slate-200 mb-8">
                Schedule exams, manage proctors, track scores, and issue credentials. 
                Everything you need for a professional testing center.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/admin/testing" className="inline-flex items-center justify-center gap-2 bg-brand-red-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-brand-red-700 transition-all hover:-translate-y-0.5">
                  Open Testing Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="#exams" className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white font-bold px-8 py-4 rounded-xl border border-white/20 hover:bg-white/20 transition-all">
                  View Exam Options
                </Link>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="font-bold text-slate-900">Live Testing Dashboard</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <span className="text-sm text-slate-700">Today Exams</span>
                  </div>
                  <span className="font-bold text-slate-900">12</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-slate-400" />
                    <span className="text-sm text-slate-700">Scheduled</span>
                  </div>
                  <span className="font-bold text-slate-900">47</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm text-slate-700">Passed Today</span>
                  </div>
                  <span className="font-bold text-emerald-600">9</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything You Need</h2>
            <p className="text-lg text-slate-600">Complete testing center management in one platform</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <Icon className="w-8 h-8 text-brand-red-600 mb-4" />
                  <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-slate-600 text-sm">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Exams */}
      <section id="exams" className="py-16 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Supported Exams</h2>
            <p className="text-lg text-slate-600">Multiple certification providers in one place</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map(exam => (
              <div key={exam.name} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-brand-red-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-brand-red-600" />
                  </div>
                  <span className="text-lg font-bold text-slate-900">{exam.price}</span>
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{exam.name}</h3>
                <p className="text-slate-600 text-sm mb-4">{exam.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {exam.providers.map(p => (
                    <span key={p} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <Award className="w-12 h-12 text-yellow-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Ready to set up your testing center?</h2>
          <p className="text-xl text-slate-300 mb-8">
            Start your 14-day trial and get full access to the testing center.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/store/trial" className="inline-flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-all hover:-translate-y-0.5">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/contact?subject=Testing+Center" className="inline-flex items-center justify-center gap-2 border border-slate-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-slate-800 transition-all">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

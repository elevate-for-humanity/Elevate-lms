'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, CheckCircle2, Clock, DollarSign, ArrowRight, Phone, Search, AlertCircle, Circle } from 'lucide-react';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  pending: { color: 'text-slate-600', bg: 'bg-slate-100', icon: Circle },
  in_progress: { color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock },
  complete: { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2 },
  approved: { color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle2 },
};

export default function EnrollmentPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [app, setApp] = useState<any>(null);
  const [error, setError] = useState('');

  const lookup = async () => {
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/enrollment-v2/apply?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Application not found');
      setApp(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = app ? [
    { id: 'application', title: 'Application', status: 'complete', description: `Application ${app.confirmation_number} submitted` },
    { id: 'interview', title: 'Interview & Review', status: app.interview_status === 'completed' ? 'complete' : 'in_progress', description: app.interview_status === 'completed' ? 'Paris AI interview complete' : 'In progress' },
    { id: 'binder', title: 'Document Binder', status: app.binder_status === 'approved' ? 'complete' : 'in_progress', description: app.binder_status === 'approved' ? 'Documents approved' : app.binder_status === 'complete' ? 'Documents submitted' : 'Upload required documents' },
    { id: 'funding', title: 'Funding Verification', status: app.funding_status === 'approved' || app.funding_status === 'eligible' ? 'complete' : app.funding_status === 'screening' ? 'in_progress' : 'pending', description: app.funding_status === 'approved' ? 'Funding approved' : app.funding_source === 'self' ? 'Self-pay — BNPL available' : 'Verifying eligibility' },
    { id: 'agreement', title: 'Enrollment Agreement', status: app.agreement_status === 'signed' ? 'complete' : app.enrollment_status === 'approved' || app.enrollment_status === 'enrolled' ? 'in_progress' : 'pending', description: app.agreement_status === 'signed' ? 'Agreement signed' : 'Pending signature' },
    { id: 'orientation', title: 'Orientation', status: app.orientation_status === 'completed' ? 'complete' : app.enrollment_status === 'active' ? 'in_progress' : 'pending', description: app.orientation_status === 'completed' ? 'Orientation complete' : app.enrollment_status === 'active' ? 'Ready to start' : 'Pending enrollment' },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Banner */}
      <section className="relative w-full h-[40vh] min-h-[280px] max-h-[400px] overflow-hidden">
        <Image
          src="/images/hero/hero-main-welcome.webp"
          alt="Student enrollment at Elevate for Humanity"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-900/80 to-brand-blue-900/40" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 w-full">
            <p className="text-brand-orange-400 text-xs font-bold uppercase tracking-widest mb-2">
              Enrollment
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
              Start Your Training Journey
            </h1>
            <p className="text-slate-200 max-w-xl">
              Complete your enrollment in 4 simple steps. Most eligible students pay $0 in tuition.
            </p>
          </div>
        </div>
      </section>

      {/* Enrollment Status Tracker */}
      {app && (
        <section className="py-8 bg-brand-blue-900">
          <div className="max-w-3xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold">{app.program_name} — {app.confirmation_number}</h2>
                  <p className="text-sm text-slate-500 capitalize">
                    Status: {app.enrollment_status?.replace(/_/g, ' ')} | Funding: {app.funding_source?.replace(/_/g, ' ') || 'Self-pay'}
                  </p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  app.enrollment_status === 'active' ? 'bg-green-100 text-green-700' :
                  app.enrollment_status === 'enrolled' ? 'bg-blue-100 text-blue-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {app.enrollment_status?.toUpperCase().replace(/_/g, ' ')}
                </span>
              </div>
              <div className="space-y-2">
                {steps.map(step => {
                  const cfg = STATUS_CONFIG[step.status] || STATUS_CONFIG.pending;
                  const Icon = cfg.icon;
                  return (
                    <div key={step.id} className="flex items-center gap-3">
                      <div className={`${cfg.bg} ${cfg.color} w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium">{step.title}</span>
                        <span className="text-xs text-slate-400 ml-2">{step.description}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {app.enrollment_status === 'active' && (
                <Link href="/lms/dashboard" className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors">
                  Go to My Courses <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Status Lookup */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-2">Check Your Enrollment Status</h2>
            <p className="text-slate-500 text-sm mb-4">Enter your application email to see your progress.</p>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && lookup()}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-brand-blue-600 focus:outline-none"
                />
              </div>
              <button onClick={lookup} disabled={loading || !email}
                className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-50">
                {loading ? 'Searching...' : 'Find My Application'}
              </button>
            </div>
            {error && (
              <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          {/* Steps */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Your Enrollment Journey</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex gap-4 p-5 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">1</div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Check Eligibility</h3>
                  <p className="text-slate-600 text-sm">We screen for WIOA, Workforce Ready Grant, FSSA IMPACT, and Job Ready Indy funding.</p>
                </div>
              </div>
              <div className="flex gap-4 p-5 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">2</div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Complete Application</h3>
                  <p className="text-slate-600 text-sm">Submit your program application with required documents.</p>
                </div>
              </div>
              <div className="flex gap-4 p-5 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">3</div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Enrollment Agreement</h3>
                  <p className="text-slate-600 text-sm">Review and sign your enrollment documents.</p>
                </div>
              </div>
              <div className="flex gap-4 p-5 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-brand-green-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">4</div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Start Training</h3>
                  <p className="text-slate-600 text-sm">Begin your workforce training with expert instructors.</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-brand-blue-700 to-brand-blue-900 rounded-2xl p-8 text-center text-white mb-8">
            <h3 className="text-2xl font-bold mb-3">Ready to Get Started?</h3>
            <p className="text-blue-100 mb-6 max-w-xl mx-auto">
              Most eligible Indiana residents pay $0 in tuition through WIOA and state workforce funding programs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/apply" className="bg-brand-orange-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-orange-700 inline-flex items-center justify-center gap-2">
                Check Your Eligibility
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="tel:3173143757" className="bg-white/10 backdrop-blur text-white font-bold py-3 px-8 rounded-lg hover:bg-white/20 inline-flex items-center justify-center gap-2 border border-white/20">
                <Phone className="w-4 h-4" />
                Call (317) 314-3757
              </a>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow">
              <Clock className="w-8 h-8 text-brand-blue-600 mb-3" />
              <h4 className="font-bold mb-2">Fast Process</h4>
              <p className="text-sm text-slate-600">Eligibility check takes 3-5 minutes. Application takes about 10 minutes.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow">
              <DollarSign className="w-8 h-8 text-brand-green-600 mb-3" />
              <h4 className="font-bold mb-2">Most Pay $0</h4>
              <p className="text-sm text-slate-600">Eligible participants receive fully funded training through workforce programs.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow">
              <CheckCircle2 className="w-8 h-8 text-brand-orange-600 mb-3" />
              <h4 className="font-bold mb-2">Get Supported</h4>
              <p className="text-sm text-slate-600">Career coaches help you navigate barriers and stay on track.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

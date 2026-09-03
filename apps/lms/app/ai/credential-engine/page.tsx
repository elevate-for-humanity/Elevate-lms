import { Metadata } from 'next';
import Link from 'next/link';
import { Award, Shield, CheckCircle, FileText, Clock, BarChart3, Globe, Download } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Credential Engine | Digital Certification & Verification',
  description: 'Issue, manage, and verify digital credentials and certifications through the Elevate platform.',
};

const features = [
  { icon: Shield, title: 'Controlled Issuance', description: 'Authorized staff can manage credential records through protected administrative workflows.' },
  { icon: Globe, title: 'Verification Workflows', description: 'Credential records can be shared through configured verification workflows.' },
  { icon: Download, title: 'Digital Records', description: 'Students can access configured digital credential records through supported learner experiences.' },
  { icon: BarChart3, title: 'Analytics Dashboard', description: 'Authorized users can review available credential issuance and verification activity.' },
  { icon: FileText, title: 'Rich Metadata', description: 'Credential records can include skills, competencies, completion dates, and criteria.' },
  { icon: Clock, title: 'Expiration Management', description: 'Track expiration dates for time-limited credentials and support renewal workflows.' },
];

export default function CredentialEnginePage() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-900 via-orange-900 to-red-900 text-white">
        <div className="absolute inset-0 opacity-20"><div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500 rounded-full filter blur-3xl"></div><div className="absolute bottom-0 left-1/4 w-96 h-96 bg-orange-500 rounded-full filter blur-3xl"></div></div>
        <div className="relative max-w-7xl mx-auto px-4 py-24"><div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-400/30 rounded-full text-sm mb-6"><Award className="w-4 h-4" />Digital Credential Platform</div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Credential Engine</h1>
          <p className="text-xl text-slate-300 mb-8">Issue, manage, and verify digital credential records through protected platform workflows.</p>
          <div className="flex flex-wrap gap-4">
            <a href="https://admin.elevateforhumanity.org/credentials" className="px-8 py-4 bg-amber-600 rounded-lg font-semibold hover:bg-amber-500 transition">Manage Credentials</a>
            <Link href="/contact" className="px-8 py-4 bg-white/10 border border-white/30 rounded-lg font-semibold hover:bg-white/20 transition">Request Demo</Link>
          </div>
        </div></div>
      </section>
      <section className="py-20 bg-white"><div className="max-w-7xl mx-auto px-4"><div className="text-center mb-16"><h2 className="text-3xl font-bold mb-4">Credential Management</h2><p className="text-slate-600 max-w-2xl mx-auto">Manage credential records, metadata, verification workflows, and expiration information through role-based platform controls.</p></div><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">{features.map((feature) => { const Icon = feature.icon; return <div key={feature.title} className="group p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-amber-200 hover:shadow-lg transition-all"><div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-200 transition-colors"><Icon className="w-6 h-6 text-amber-600" /></div><h3 className="text-lg font-bold mb-2">{feature.title}</h3><p className="text-slate-600 text-sm">{feature.description}</p></div>; })}</div></div></section>
      <section className="py-20 bg-slate-50"><div className="max-w-5xl mx-auto px-4 text-center"><CheckCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" /><h2 className="text-3xl font-bold mb-4">Use verified records, not unsupported claims</h2><p className="text-slate-600">Credential capabilities shown here describe platform functions. Credential validity and issuing authority remain subject to the applicable program, certifying body, or licensing authority.</p></div></section>
    </div>
  );
}
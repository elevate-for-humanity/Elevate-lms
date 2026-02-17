import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Building2 } from 'lucide-react';
import PageAvatar from '@/components/PageAvatar';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Employer Portal | Elevate For Humanity',
  description: 'Manage apprentices, track training progress, and access employer tools.',
};

export default function EmployerPortalLanding() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Employer Portal' }]} />
        </div>
      </div>

      {/* Hero with Image */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/business/handshake-1.jpg" alt="Employer Portal" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Employer Partner Portal</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Manage your apprentices, track their training progress, and access employer resources.</p>
          </div>
        </div>
      </section>

      {/* Avatar Guide */}
      <PageAvatar 
        videoSrc="/videos/avatars/orientation-guide.mp4" 
        title="Employer Welcome" 
      />

      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Portal Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border">
              <div className="relative h-32">
                <Image src="/images/healthcare/healthcare-programs-grid.jpg" alt="Apprentice Management" fill sizes="100vw" className="object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Apprentice Management</h3>
                <p className="text-slate-600">View and manage your apprentices and their progress.</p>
              </div>
            </div>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border">
              <div className="relative h-32">
                <Image src="/images/employers/employer-meeting.jpg" alt="Training Progress" fill sizes="100vw" className="object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Training Progress</h3>
                <p className="text-slate-600">Track training completion and skill development.</p>
              </div>
            </div>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border">
              <div className="relative h-32">
                <Image src="/images/homepage/employers.jpg" alt="Documents" fill sizes="100vw" className="object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Documents</h3>
                <p className="text-slate-600">Access agreements, reports, and compliance documents.</p>
              </div>
            </div>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border">
              <div className="relative h-32">
                <Image src="/images/business/tax-prep-certification.jpg" alt="Payroll" fill sizes="100vw" className="object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Payroll</h3>
                <p className="text-slate-600">Manage apprentice wages and payroll information.</p>
              </div>
            </div>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border">
              <div className="relative h-32">
                <Image src="/images/hub/employer.jpg" alt="Job Postings" fill sizes="100vw" className="object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Job Postings</h3>
                <p className="text-slate-600">Post positions and find qualified candidates.</p>
              </div>
            </div>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border">
              <div className="relative h-32">
                <Image src="/images/business/handshake-1.jpg" alt="Company Profile" fill sizes="100vw" className="object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Company Profile</h3>
                <p className="text-slate-600">Manage your company information and settings.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Partner With Us</h2>
          <p className="text-lg text-slate-600 mb-8">Already a partner? Sign in. New employer? Start onboarding today.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/login?redirect=/employer-portal" className="px-8 py-4 bg-brand-green-600 text-white font-bold rounded-lg hover:bg-brand-green-700">Sign In</Link>
            <Link href="/onboarding/employer" className="px-8 py-4 bg-slate-100 text-slate-900 font-bold rounded-lg hover:bg-slate-200">Employer Onboarding</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

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
      <section className="relative min-h-[400px] flex items-center overflow-hidden">
        <Image
          src="/images/business/handshake-1.jpg"
          alt="Employer Portal"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-green-900/70" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 w-full">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-10 h-10 text-white" />
            <span className="text-green-200 font-medium">Employer Portal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Employer Partner Portal</h1>
          <p className="text-xl text-green-100 max-w-2xl mb-8">
            Manage your apprentices, track their training progress, and access employer resources.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/login?redirect=/employer-portal" className="px-8 py-4 bg-white text-green-600 font-bold rounded-lg hover:bg-green-50">
              Sign In
            </Link>
            <Link href="/onboarding/employer" className="px-8 py-4 bg-green-500 text-white font-bold rounded-lg hover:bg-green-400">
              Employer Onboarding
            </Link>
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
            <Link href="/login?redirect=/employer-portal" className="px-8 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Sign In</Link>
            <Link href="/onboarding/employer" className="px-8 py-4 bg-slate-100 text-slate-900 font-bold rounded-lg hover:bg-slate-200">Employer Onboarding</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

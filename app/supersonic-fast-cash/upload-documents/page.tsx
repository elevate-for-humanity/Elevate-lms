import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Upload Documents | Supersonic Fast Cash',
  description: 'Securely upload your tax documents online. Our preparers review and prepare your return. You approve before filing.',
  alternates: { canonical: 'https://www.supersonicfastermoney.com/supersonic-fast-cash/upload-documents' },
};

const STEPS = [
  { number: '01', title: 'Create Your Account', desc: 'Sign up for a secure client portal account. Your documents are encrypted in transit and at rest.', image: '/images/pages/admin-documents-hero.jpg' },
  { number: '02', title: 'Upload Your Documents', desc: 'Upload photos or scans of your W-2s, 1099s, ID, and any other tax documents. Accepted formats: PDF, JPG, PNG.', image: '/images/pages/admin-documents-upload-hero.jpg' },
  { number: '03', title: 'We Prepare Your Return', desc: 'A PTIN-credentialed preparer reviews your documents and prepares your complete federal and state return. Typically completed within 24–48 hours.', image: '/images/pages/supersonic-tax-prep.jpg' },
  { number: '04', title: 'Review and Approve', desc: 'We send you a copy of your completed return to review. You approve electronically before anything is filed with the IRS.', image: '/images/pages/supersonic-page-8.jpg' },
];

const ACCEPTED = [
  { label: 'W-2 Forms', image: '/images/pages/admin-tax-apps-hero.jpg' },
  { label: '1099 Forms', image: '/images/pages/finance-accounting.jpg' },
  { label: 'Photo ID', image: '/images/pages/admin-documents-hero.jpg' },
  { label: 'Social Security Cards', image: '/images/pages/supersonic-page-6.jpg' },
  { label: 'Prior Year Return', image: '/images/pages/admin-tax-filing-hero.jpg' },
  { label: 'Bank Account Info', image: '/images/pages/supersonic-page-2.jpg' },
];

export default async function UploadDocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-white">
      <SupersonicPageHero
        image="/images/pages/admin-documents-upload-hero.jpg"
        alt="Securely upload your tax documents"
        title="Upload Your Tax Documents"
        subtitle="Secure document upload. Our preparers handle the rest. You review and approve before filing."
      />

      {/* STEPS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">How It Works</h2>
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">Upload your documents and we handle the preparation. Most returns completed within 24–48 hours.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step) => (
              <div key={step.number} className="flex flex-col">
                <div className="relative h-48 rounded-xl overflow-hidden mb-5">
                  <Image src={step.image} alt={step.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
                  <div className="absolute top-3 left-3 bg-brand-red-600 text-white text-sm font-black px-3 py-1 rounded-lg">{step.number}</div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UPLOAD CTA */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="relative h-52 rounded-2xl overflow-hidden mb-8">
            <Image src="/images/pages/supersonic-page-3.jpg" alt="Upload documents securely" fill className="object-cover" sizes="(max-width: 768px) 100vw, 672px" />
          </div>
          {user ? (
            <Link href="/supersonic-fast-cash/portal" className="inline-block px-10 py-4 bg-brand-red-600 text-white font-black text-xl rounded-xl hover:bg-brand-red-700 transition-colors">
              Go to Client Portal
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup?redirect=/supersonic-fast-cash/portal" className="px-10 py-4 bg-brand-red-600 text-white font-black text-xl rounded-xl hover:bg-brand-red-700 transition-colors">
                Create Account & Upload
              </Link>
              <Link href="/login?redirect=/supersonic-fast-cash/portal" className="px-10 py-4 bg-white border-2 border-slate-900 text-slate-900 font-black text-xl rounded-xl hover:bg-slate-50 transition-colors">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ACCEPTED DOCUMENTS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">Accepted Documents</h2>
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">Upload photos or scans. PDF, JPG, and PNG accepted. Maximum 25MB per file.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {ACCEPTED.map((doc) => (
              <div key={doc.label} className="rounded-xl overflow-hidden border border-slate-200">
                <div className="relative h-28">
                  <Image src={doc.image} alt={doc.label} fill className="object-cover" sizes="(max-width: 768px) 50vw, 16vw" />
                </div>
                <div className="p-3 bg-white">
                  <p className="text-sm font-semibold text-slate-900 text-center">{doc.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative h-[45vh] min-h-[320px]">
        <Image src="/images/pages/supersonic-page-9.jpg" alt="Get your taxes done" fill className="object-cover object-center" sizes="100vw" />
        <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center">
          <div className="text-center px-4">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Prefer to Come In Person?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/supersonic-fast-cash/book-appointment" className="px-10 py-4 bg-brand-red-600 text-white font-black text-xl rounded-xl hover:bg-brand-red-700 transition-colors">Book Appointment</Link>
              <Link href="/supersonic-fast-cash/locations" className="px-10 py-4 bg-white text-slate-900 font-black text-xl rounded-xl hover:bg-slate-100 transition-colors">Find a Location</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

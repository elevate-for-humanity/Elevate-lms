import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Clock, Phone, Mail } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getProgramConfig, getAllProgramSlugs } from '@/lib/partners/program-config';

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_30MIN || 'https://calendly.com/elevate4humanityedu/30min';

export async function generateStaticParams() {
  return getAllProgramSlugs().map(slug => ({ program: slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ program: string }> }): Promise<Metadata> {
  const { program } = await params;
  const config = getProgramConfig(program);
  if (!config) return { title: 'Not Found' };

  return {
    title: `Application Submitted — ${config.shortName} | Elevate for Humanity`,
    robots: { index: false, follow: false },
  };
}

export default async function ThankYouPage({ params }: { params: Promise<{ program: string }> }) {
  const { program } = await params;
  const config = getProgramConfig(program);
  if (!config) notFound();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[
          { label: 'Partners', href: '/partners' },
          { label: config.shortName, href: `/partners/programs/${program}` },
          { label: 'Application Submitted' },
        ]} />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-green-600 text-3xl">✓</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Application Submitted!</h1>
          <p className="text-lg text-black">
            Thank you for applying to the <strong>{config.shortName} Partner Program</strong>.
            We&apos;ve sent a confirmation email with program details and next steps.
          </p>
        </div>

        {config.siteVisitRequired && (
          <div className="bg-orange-50 border border-orange-200 p-8 rounded-xl mb-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Schedule Your Site Visit</h3>
            <p className="text-black mb-4">
              Book your 15-minute Zoom site visit now. We&apos;ll walk through your {config.siteLabel} and answer any questions.
            </p>
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 bg-orange-500 text-white rounded-lg font-bold text-lg hover:bg-orange-600 transition-colors"
            >
              Schedule Site Visit <ArrowRight className="w-5 h-5 ml-2" />
            </a>
          </div>
        )}

        <div className="bg-brand-blue-50 p-6 rounded-xl mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-brand-blue-600" />
            <span className="font-semibold text-gray-900">Confirmation Email Sent</span>
          </div>
          <p className="text-black text-sm">
            Check your inbox for a confirmation email with your application details, program info, and the MOU template.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8">
          <h3 className="font-semibold text-gray-900 mb-3">What Happens Next</h3>
          <ol className="space-y-2 text-sm text-black">
            <li className="flex gap-2"><span className="font-bold text-orange-500">1.</span> We verify your credentials (1-3 business days)</li>
            {config.siteVisitRequired && (
              <li className="flex gap-2"><span className="font-bold text-orange-500">2.</span> Video site visit via Zoom (~15 minutes)</li>
            )}
            <li className="flex gap-2"><span className="font-bold text-orange-500">{config.siteVisitRequired ? '3' : '2'}.</span> MOU review and signing</li>
            <li className="flex gap-2"><span className="font-bold text-orange-500">{config.siteVisitRequired ? '4' : '3'}.</span> Approval (~{config.approvalTimeline})</li>
          </ol>
        </div>

        <div className="bg-white p-6 rounded-xl mb-8">
          <h3 className="font-semibold text-gray-900 mb-3">Questions?</h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:+13173143757" className="inline-flex items-center justify-center gap-2 text-gray-700 hover:text-brand-blue-600">
              <Phone className="w-4 h-4" /> (317) 314-3757
            </a>
            <a href="/contact" className="inline-flex items-center justify-center gap-2 text-gray-700 hover:text-brand-blue-600">
              <Mail className="w-4 h-4" /> Contact Us
            </a>
          </div>
        </div>

        <div className="text-center">
          <Link href="/partners" className="text-orange-600 hover:text-orange-700 font-medium">
            ← Back to Partner Programs
          </Link>
        </div>
      </div>
    </div>
  );
}

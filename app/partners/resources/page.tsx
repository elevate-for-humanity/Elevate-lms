import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { BookOpen, FileText, Video, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Partner Resources | Elevate for Humanity',
  description: 'Resources, guides, and documentation for training partners.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/partners/resources',
  },
};

export default function PartnerResourcesPage() {
  return (
    <div className="min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Partners", href: "/partners" }, { label: "Resources" }]} />
      </div>
<div className="container mx-auto px-4 max-w-4xl">
        <Link
          href="/partners"
          className="inline-flex items-center text-brand-orange-600 hover:underline mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Partners
        </Link>

        <h1 className="text-4xl font-bold mb-4">Partner Resources</h1>
        <p className="text-xl text-black mb-12">
          Guides, templates, and documentation to help you succeed as a training
          partner.
        </p>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start gap-4">
              <BookOpen className="h-10 w-10 text-brand-orange-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">
                  Partner Handbook
                </h3>
                <p className="text-black mb-4">
                  Complete guide to program requirements, compliance, and best
                  practices.
                </p>
                <Link href="/program-holder/documents">
                  <Button variant="outline">Download Handbook</Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start gap-4">
              <FileText className="h-10 w-10 text-brand-orange-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">MOU Templates</h3>
                <p className="text-black mb-4">
                  Memorandum of Understanding templates and signing process.
                </p>
                <Link href="/program-holder/documents">
                  <Button variant="outline">View Templates</Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start gap-4">
              <Video className="h-10 w-10 text-brand-orange-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Training Videos</h3>
                <p className="text-black mb-4">
                  Video tutorials on using the platform and managing students.
                </p>
                <Link href="/program-holder/dashboard">
                  <Button variant="outline">Watch Videos</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-brand-orange-50 border border-brand-orange-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-2">Need More Help?</h2>
          <p className="text-black mb-4">
            Contact our partner support team for personalized assistance.
          </p>
          <Link href="/contact">
            <Button>Contact Support</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Copyright as CopyrightIcon, Shield, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/copyright',
  },
  title: 'Copyright & Intellectual Property | Elevate For Humanity',
  description:
    'Copyright and intellectual property information for Elevate for Humanity platform and content.',
};

export default async function CopyrightPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch copyright policy
  const { data: policy } = await supabase
    .from('legal_documents')
    .select('*')
    .eq('type', 'copyright')
    .single();
  return (
    <div className="min-h-screen bg-gray-50 py-16">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Copyright" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <CopyrightIcon className="w-10 h-10 text-brand-blue-600" />
          <h1 className="text-4xl font-bold text-black">
            Copyright & Intellectual Property
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-black mb-4">Ownership</h2>
          <p className="text-lg text-black leading-relaxed mb-4">
            All original content, platform architecture, workflows, designs,
            documentation, and software components associated with Elevate for
            Humanity are protected by copyright and intellectual property laws.
          </p>
          <p className="text-lg font-bold text-black">
            © Elevate for Humanity. All rights reserved.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-black mb-6">
            What Is Protected
          </h2>

          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-brand-blue-600 rounded-full mt-2 flex-shrink-0" />
              <span className="text-black">
                Website content and structure
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-brand-blue-600 rounded-full mt-2 flex-shrink-0" />
              <span className="text-black">
                Platform workflows and dashboards
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-brand-blue-600 rounded-full mt-2 flex-shrink-0" />
              <span className="text-black">Documentation and reports</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-brand-blue-600 rounded-full mt-2 flex-shrink-0" />
              <span className="text-black">
                Branding, logos, and design elements
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-brand-blue-600 rounded-full mt-2 flex-shrink-0" />
              <span className="text-black">
                Proprietary configurations and integrations
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-blue-50 border-l-4 border-brand-blue-600 p-6 mb-8">
          <h3 className="text-xl font-bold text-black mb-3">
            Partner & Program Content
          </h3>
          <p className="text-black mb-3">
            Training materials, curricula, certifications, and course content
            delivered by partners remain the property of their respective
            owners.
          </p>
          <p className="text-black font-semibold">
            Elevate for Humanity does not claim ownership over partner-provided
            educational content.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-black mb-4">
            Permitted Use
          </h2>
          <p className="text-black leading-relaxed">
            Content may not be copied, reproduced, redistributed, or repurposed
            without written authorization, except where explicitly stated.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-black mb-6">
            Platform Licensing & Authorization
          </h2>

          <h3 className="text-lg font-bold text-black mb-3">
            Platform Use Authorization
          </h3>
          <p className="text-black mb-4">
            Use of the Elevate for Humanity platform for organizational,
            workforce, or training operations requires:
          </p>

          <ul className="space-y-2 mb-6">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-brand-orange-600 rounded-full mt-2 flex-shrink-0" />
              <span className="text-black">A formal agreement</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-brand-orange-600 rounded-full mt-2 flex-shrink-0" />
              <span className="text-black">Explicit authorization</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-brand-orange-600 rounded-full mt-2 flex-shrink-0" />
              <span className="text-black">Defined scope of use</span>
            </li>
          </ul>

          <p className="text-black font-semibold mb-6">
            Unauthorized use, replication, or resale of platform components is
            prohibited.
          </p>

          <h3 className="text-lg font-bold text-black mb-3">
            Licensing Clarity
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-brand-green-600 rounded-full mt-2 flex-shrink-0" />
              <span className="text-black">
                Platform access is granted by agreement, not purchase alone
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-brand-green-600 rounded-full mt-2 flex-shrink-0" />
              <span className="text-black">
                Licensing does not transfer ownership
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-brand-green-600 rounded-full mt-2 flex-shrink-0" />
              <span className="text-black">
                Access may be revoked if terms are violated
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-orange-50 border-l-4 border-orange-500 p-6 mb-8">
          <h3 className="text-xl font-bold text-black mb-3">
            Tax Services - Special Authorization Notice
          </h3>

          <div className="mb-4">
            <h4 className="font-bold text-black mb-2">
              Free Tax Services (Rise Up Foundation)
            </h4>
            <ul className="space-y-1 text-black text-sm">
              <li>• Operates under IRS VITA/TCE guidelines</li>
              <li>• Volunteers are authorized and trained annually</li>
              <li>• No paid services offered</li>
              <li>• No compensation tied to tax preparation</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-black mb-2">
              Paid Tax Services (SupersonicFastCash)
            </h4>
            <ul className="space-y-1 text-black text-sm">
              <li>• Operates as a for-profit entity</li>
              <li>• Requires licensed preparers (PTIN/EFIN)</li>
              <li>• Separate systems, branding, and billing</li>
              <li>• No overlap with free tax services</li>
            </ul>
          </div>

          <p className="text-black font-semibold mt-4">
            This separation is intentional and mandatory.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/platform/licensing"
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border-2 border-gray-200 hover:border-blue-500"
          >
            <Shield className="w-8 h-8 text-brand-blue-600 mb-3" />
            <h3 className="text-lg font-bold text-black mb-2">
              Platform Licensing
            </h3>
            <p className="text-sm text-black">
              Learn about licensing the Elevate platform
            </p>
          </Link>

          <Link
            href="/contact"
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border-2 border-gray-200 hover:border-blue-500"
          >
            <FileText className="w-8 h-8 text-brand-blue-600 mb-3" />
            <h3 className="text-lg font-bold text-black mb-2">Contact Us</h3>
            <p className="text-sm text-black">
              Questions about copyright or licensing
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

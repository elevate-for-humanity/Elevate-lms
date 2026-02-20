export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Shield, FileText, BarChart3, ArrowLeft } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
export const metadata: Metadata = {
  title: 'Partner Compliance Tools | Elevate for Humanity',
  description: 'Compliance tools and resources for training partners.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/partners/compliance',
  },
};

export default async function PartnerCompliancePage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('partners').select('*').limit(50);

  return (
    <div className="min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Partners", href: "/partners" }, { label: "Compliance" }]} />
      </div>
<div className="container mx-auto px-4 max-w-4xl">
        <Link
          href="/partners"
          className="inline-flex items-center text-brand-orange-600 hover:underline mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Partners
        </Link>

        <div className="text-center mb-12">
          <Shield className="h-16 w-16 text-brand-orange-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Compliance Tools</h1>
          <p className="text-xl text-black">
            Everything you need to maintain WIOA and DOL compliance.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <FileText className="h-12 w-12 text-brand-orange-600 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Reporting</h3>
            <p className="text-black text-sm mb-4">
              Automated WIOA reporting and documentation
            </p>
            <Link href="/program-holder/reports">
              <Button variant="outline" size="sm">
                View Reports
              </Button>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <BarChart3 className="h-12 w-12 text-brand-orange-600 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Analytics</h3>
            <p className="text-black text-sm mb-4">
              Track student outcomes and performance
            </p>
            <Link href="/program-holder/dashboard">
              <Button variant="outline" size="sm">
                View Dashboard
              </Button>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <Shield className="h-12 w-12 text-brand-orange-600 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Documentation</h3>
            <p className="text-black text-sm mb-4">
              Access compliance guides and templates
            </p>
            <Link href="/program-holder/documents">
              <Button variant="outline" size="sm">
                View Documents
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-brand-orange-50 border border-brand-orange-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-2">Need Help?</h2>
          <p className="text-black mb-4">
            Our compliance team is here to support you. Access your partner
            portal for full compliance tools and support.
          </p>
          <Link href="/program-holder/dashboard">
            <Button>Access Partner Portal</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

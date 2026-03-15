import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FileText, Download, Printer, ArrowLeft } from 'lucide-react';

export default function BrandingAddendumPage() {
  return (
    <div className="min-h-screen bg-white py-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Contracts", href: "/contracts" }, { label: "Branding Addendum" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4">
        <Link href="/contracts" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Contracts
        </Link>
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-brand-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Branding Addendum</h1>
                <p className="text-gray-600">Co-branding and marketing guidelines</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-white"><Printer className="w-4 h-4" /> Print</button>
              <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"><Download className="w-4 h-4" /> Download PDF</button>
            </div>
          </div>
          <div className="p-8 prose max-w-none">
            <h2>1. Purpose</h2>
            <p>This Branding Addendum establishes guidelines for the use of Elevate for Humanity branding materials, logos, and marketing assets by authorized partners.</p>
            <h2>2. Logo Usage</h2>
            <p>Partners may use the Elevate for Humanity logo in accordance with the following guidelines:</p>
            <ul>
              <li>Logo must maintain minimum clear space equal to the height of the "E" in Elevate</li>
              <li>Logo may not be altered, distorted, or recolored without written approval</li>
              <li>Logo must be used on appropriate backgrounds that maintain visibility</li>
            </ul>
            <h2>3. Co-Branding Materials</h2>
            <p>All co-branded materials must be submitted for approval at least 10 business days prior to intended use. Materials include but are not limited to:</p>
            <ul>
              <li>Print advertisements and flyers</li>
              <li>Digital marketing materials</li>
              <li>Social media posts</li>
              <li>Press releases</li>
            </ul>
            <h2>4. Approval Process</h2>
            <p>Submit all materials to our contact form for review. Approval or revision requests will be provided within 5 business days.</p>
            <h2>5. Term</h2>
            <p>This addendum remains in effect for the duration of the master agreement unless terminated earlier by either party with 30 days written notice.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

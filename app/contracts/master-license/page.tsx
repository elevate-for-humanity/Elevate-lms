import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FileText, Download, Printer, ArrowLeft, Key } from 'lucide-react';

export default function MasterLicensePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Contracts", href: "/contracts" }, { label: "Master License" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4">
        <Link href="/contracts" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Contracts
        </Link>
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Master License Agreement</h1>
                <p className="text-gray-600">Platform and curriculum licensing terms</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Printer className="w-4 h-4" /> Print</button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Download className="w-4 h-4" /> Download PDF</button>
            </div>
          </div>
          <div className="p-8 prose max-w-none">
            <h2>1. Grant of License</h2>
            <p>Elevate for Humanity grants Licensee a non-exclusive, non-transferable license to use the Elevate LMS platform and associated curriculum materials.</p>
            <h2>2. Scope of License</h2>
            <ul>
              <li>Access to Elevate LMS platform for enrolled students</li>
              <li>Use of approved curriculum and training materials</li>
              <li>Issuance of certificates upon program completion</li>
              <li>Access to instructor resources and support materials</li>
            </ul>
            <h2>3. License Fees</h2>
            <p>Fees are based on the selected tier and student enrollment:</p>
            <ul>
              <li><strong>Starter:</strong> $500/month up to 50 students</li>
              <li><strong>Professional:</strong> $1,500/month up to 200 students</li>
              <li><strong>Enterprise:</strong> Custom pricing for unlimited students</li>
            </ul>
            <h2>4. Intellectual Property</h2>
            <p>All curriculum, platform code, and materials remain the property of Elevate for Humanity. Licensee may not modify, redistribute, or create derivative works.</p>
            <h2>5. Support and Updates</h2>
            <p>License includes access to platform updates, bug fixes, and standard support during business hours.</p>
            <h2>6. Term and Termination</h2>
            <p>Initial term of 12 months with automatic annual renewal. Either party may terminate with 90 days written notice.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

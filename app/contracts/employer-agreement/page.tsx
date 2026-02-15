import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Download, Printer, ArrowLeft, Briefcase } from 'lucide-react';

export default function EmployerAgreementPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Contracts", href: "/contracts" }, { label: "Employer Agreement" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4">
        <Link href="/contracts" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Contracts
        </Link>
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-orange-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Employer Partnership Agreement</h1>
                <p className="text-gray-600">Hiring and OJT partnership terms</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Printer className="w-4 h-4" /> Print</button>
              <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"><Download className="w-4 h-4" /> Download PDF</button>
            </div>
          </div>
          <div className="p-8 prose max-w-none">
            <h2>1. Purpose</h2>
            <p>This Agreement establishes a partnership for hiring program graduates and participating in On-the-Job Training (OJT) programs.</p>
            <h2>2. Employer Commitments</h2>
            <ul>
              <li>Provide meaningful employment opportunities to qualified graduates</li>
              <li>Offer competitive wages and benefits</li>
              <li>Participate in job fairs and recruitment events</li>
              <li>Provide feedback on graduate performance and curriculum relevance</li>
            </ul>
            <h2>3. OJT Program Terms</h2>
            <p>For employers participating in OJT:</p>
            <ul>
              <li>Reimbursement rate: Up to 50% of wages during training period</li>
              <li>Training period: 4-26 weeks based on occupation complexity</li>
              <li>Required documentation: Training plan, time sheets, progress reports</li>
            </ul>
            <h2>4. Elevate Commitments</h2>
            <ul>
              <li>Pre-screen candidates based on employer requirements</li>
              <li>Provide job-ready graduates with verified credentials</li>
              <li>Offer ongoing support during transition period</li>
              <li>Process OJT reimbursements within 30 days of documentation</li>
            </ul>
            <h2>5. Term</h2>
            <p>This agreement is effective for one year and automatically renews unless terminated with 30 days notice.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

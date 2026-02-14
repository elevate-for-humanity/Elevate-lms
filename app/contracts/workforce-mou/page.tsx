import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FileText, Download, Printer, ArrowLeft, Users } from 'lucide-react';

export default function WorkforceMOUPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Contracts", href: "/contracts" }, { label: "Workforce Mou" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4">
        <Link href="/contracts" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Contracts
        </Link>
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-teal-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Workforce Board MOU</h1>
                <p className="text-gray-600">Memorandum of Understanding for WIOA partnerships</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Printer className="w-4 h-4" /> Print</button>
              <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"><Download className="w-4 h-4" /> Download PDF</button>
            </div>
          </div>
          <div className="p-8 prose max-w-none">
            <h2>1. Purpose</h2>
            <p>This Memorandum of Understanding establishes a partnership between Elevate for Humanity and the Workforce Development Board for the delivery of WIOA-funded training services.</p>
            <h2>2. Elevate Responsibilities</h2>
            <ul>
              <li>Maintain ETPL-approved training programs</li>
              <li>Provide quality instruction meeting state standards</li>
              <li>Track and report student outcomes as required</li>
              <li>Maintain required documentation for audits</li>
              <li>Achieve minimum performance benchmarks</li>
            </ul>
            <h2>3. Workforce Board Responsibilities</h2>
            <ul>
              <li>Refer eligible participants to approved programs</li>
              <li>Process ITA vouchers in timely manner</li>
              <li>Provide case management support to participants</li>
              <li>Coordinate supportive services as needed</li>
            </ul>
            <h2>4. Performance Standards</h2>
            <p>Elevate agrees to meet or exceed the following benchmarks:</p>
            <ul>
              <li>Program completion rate: 75% minimum</li>
              <li>Credential attainment: 70% minimum</li>
              <li>Employment rate (Q2 post-exit): 65% minimum</li>
              <li>Median earnings: Meet or exceed state median</li>
            </ul>
            <h2>5. Term</h2>
            <p>This MOU is effective for the current program year and renews annually upon mutual agreement and continued ETPL eligibility.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

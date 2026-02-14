import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FileText, Download, Printer, ArrowLeft, Shield } from 'lucide-react';

export default function DataSharingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Contracts", href: "/contracts" }, { label: "Data Sharing" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4">
        <Link href="/contracts" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Contracts
        </Link>
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Data Sharing Agreement</h1>
                <p className="text-gray-600">Student data protection and sharing protocols</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Printer className="w-4 h-4" /> Print</button>
              <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"><Download className="w-4 h-4" /> Download PDF</button>
            </div>
          </div>
          <div className="p-8 prose max-w-none">
            <h2>1. Purpose</h2>
            <p>This Data Sharing Agreement governs the collection, use, storage, and sharing of student personally identifiable information (PII) between parties.</p>
            <h2>2. Data Categories</h2>
            <ul>
              <li><strong>Enrollment Data:</strong> Name, contact information, program enrollment</li>
              <li><strong>Progress Data:</strong> Attendance, grades, completion status</li>
              <li><strong>Outcome Data:</strong> Employment status, wage information, credential attainment</li>
            </ul>
            <h2>3. Permitted Uses</h2>
            <p>Data may only be used for:</p>
            <ul>
              <li>Program administration and student support</li>
              <li>Compliance reporting to funding agencies</li>
              <li>Aggregate statistical analysis (de-identified)</li>
            </ul>
            <h2>4. Security Requirements</h2>
            <p>All parties must maintain industry-standard security measures including encryption, access controls, and regular security audits.</p>
            <h2>5. FERPA Compliance</h2>
            <p>All data handling must comply with the Family Educational Rights and Privacy Act (FERPA) and applicable state privacy laws.</p>
            <h2>6. Data Retention</h2>
            <p>Student records shall be retained for 7 years following program completion or last enrollment activity.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, CheckCircle2, Clock, DollarSign } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Enrollment | Elevate for Humanity',
  description: 'Enroll in workforce training programs. Check eligibility and apply today.',
};

export default function EnrollmentPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Enrollment</h1>
          <p className="text-blue-100">Complete your enrollment and start your training.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Enrollment Steps</h2>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                <div><h3 className="font-bold">Check Eligibility</h3><p className="text-slate-600 text-sm">Verify WIOA or funding eligibility</p></div>
              </div>
              <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                <div><h3 className="font-bold">Complete Application</h3><p className="text-slate-600 text-sm">Submit your program application</p></div>
              </div>
              <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                <div><h3 className="font-bold">Enrollment Agreement</h3><p className="text-slate-600 text-sm">Review and sign enrollment documents</p></div>
              </div>
              <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
                <div><h3 className="font-bold">Start Training</h3><p className="text-slate-600 text-sm">Begin your workforce training</p></div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <Link href="/check-eligibility" className="bg-brand-orange-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-orange-700">Check Eligibility</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

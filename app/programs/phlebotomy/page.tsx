import { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Award, Droplet } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Phlebotomy Technician | Elevate for Humanity',
  description: 'Learn phlebotomy and start a healthcare career drawing blood for tests. Quick certification program.',
};

export default function PhlebotomyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-red-700 to-red-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <span className="bg-red-600 text-white text-sm px-3 py-1 rounded-full">Healthcare</span>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-4">Phlebotomy Technician</h1>
          <p className="text-xl text-red-100 max-w-2xl mb-6">Learn to draw blood for medical tests and donations. Quick entry into healthcare with certification.</p>
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm"><Clock className="w-4 h-4" />6-8 weeks</span>
            <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm"><Award className="w-4 h-4" />NHA Certified</span>
            <span className="flex items-center gap-2 bg-brand-orange-500 px-4 py-2 rounded-full text-sm font-semibold">WIOA Funding</span>
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">About This Program</h2>
          <p className="text-lg text-slate-700 mb-6">Phlebotomy technicians draw blood for tests, transfusions, and donations. They work in hospitals, labs, and blood donation centers.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Droplet className="w-5 h-5 text-red-600" />Skills You&apos;ll Learn</h3>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li>• Venipuncture techniques</li>
                <li>• Capillary blood collection</li>
                <li>• Specimen handling and labeling</li>
                <li>• Patient safety and comfort</li>
                <li>• Infection control</li>
              </ul>
            </div>
            <div className="bg-red-50 p-6 rounded-xl">
              <h3 className="font-bold mb-4">Career Settings</h3>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li>• Hospitals and medical centers</li>
                <li>• Diagnostic laboratories</li>
                <li>• Blood donation centers</li>
                <li>• Doctor&apos;s offices</li>
                <li>• Home health agencies</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-gradient-to-br from-red-700 to-red-900 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Start Your Healthcare Career</h2>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
          <Link href="/check-eligibility" className="bg-brand-orange-500 text-white font-bold py-4 px-8 rounded-lg hover:bg-brand-orange-600">Check Eligibility</Link>
          <Link href="/contact" className="bg-white text-red-700 font-bold py-4 px-8 rounded-lg hover:bg-red-50">Contact an Advisor</Link>
        </div>
      </section>
    </div>
  );
}

import { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Award, Flame, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Welding Certification | Elevate for Humanity',
  description: 'Learn welding skills for manufacturing and construction. AWS certification prep. WIOA funding available.',
};

export default function WeldingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-orange-700 to-orange-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <span className="bg-orange-600 text-white text-sm px-3 py-1 rounded-full">Skilled Trades</span>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-4">Welding Technology</h1>
          <p className="text-xl text-orange-100 max-w-2xl mb-6">Master welding techniques for manufacturing, construction, and fabrication. AWS certification prep included.</p>
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm"><Clock className="w-4 h-4" />3-6 months</span>
            <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm"><Award className="w-4 h-4" />AWS Certified</span>
            <span className="flex items-center gap-2 bg-brand-orange-500 px-4 py-2 rounded-full text-sm font-semibold">WIOA Funding</span>
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">About This Program</h2>
          <p className="text-lg text-slate-700 mb-6">Welders are in high demand across manufacturing, construction, aerospace, and automotive industries. This program teaches multiple welding processes including MIG, TIG, and stick welding.</p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-orange-50 p-6 rounded-xl"><h3 className="font-bold mb-2">MIG Welding</h3><p className="text-slate-600 text-sm">Most common industrial welding process</p></div>
            <div className="bg-orange-50 p-6 rounded-xl"><h3 className="font-bold mb-2">TIG Welding</h3><p className="text-slate-600 text-sm">Precision welding for exotic metals</p></div>
            <div className="bg-orange-50 p-6 rounded-xl"><h3 className="font-bold mb-2">Stick Welding</h3><p className="text-slate-600 text-sm">Field and structural welding</p></div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-orange-50 rounded-xl"><div className="text-3xl font-bold text-orange-600">$42K+</div><div className="text-sm text-slate-600">Starting Salary</div></div>
            <div className="p-6 bg-orange-50 rounded-xl"><div className="text-3xl font-bold text-orange-600">3-6</div><div className="text-sm text-slate-600">Months</div></div>
            <div className="p-6 bg-green-50 rounded-xl"><div className="text-3xl font-bold text-green-600">High</div><div className="text-sm text-slate-600">Demand</div></div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-gradient-to-br from-orange-700 to-orange-900 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Start Your Welding Career</h2>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
          <Link href="/check-eligibility" className="bg-brand-orange-500 text-white font-bold py-4 px-8 rounded-lg hover:bg-brand-orange-600">Check Eligibility</Link>
          <Link href="/contact" className="bg-white text-orange-700 font-bold py-4 px-8 rounded-lg hover:bg-orange-50">Contact an Advisor</Link>
        </div>
      </section>
    </div>
  );
}

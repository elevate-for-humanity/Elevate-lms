import { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Electrical Technology | Elevate for Humanity',
  description: 'Learn electrical skills for residential and commercial work. Apprenticeship pathway available.',
};

export default function ElectricalPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-yellow-700 to-yellow-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <span className="bg-yellow-600 text-white text-sm px-3 py-1 rounded-full">Skilled Trades</span>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-4">Electrical Technology</h1>
          <p className="text-xl text-yellow-100 max-w-2xl mb-6">Master electrical systems for residential and commercial applications. High-paying trade with apprenticeship pathway.</p>
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm"><Clock className="w-4 h-4" />Apprenticeship</span>
            <span className="flex items-center gap-2 bg-brand-orange-500 px-4 py-2 rounded-full text-sm font-semibold">Earn While You Learn</span>
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">About This Program</h2>
          <p className="text-lg text-slate-700 mb-6">Electricians are among the highest-paid tradespeople. This program prepares you for electrical apprenticeships or entry-level positions.</p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-yellow-50 p-6 rounded-xl"><h3 className="font-bold mb-2"><Zap className="w-5 h-5 inline mr-2 text-yellow-600" />Residential Wiring</h3><p className="text-slate-600 text-sm">Home electrical systems and NEC code</p></div>
            <div className="bg-yellow-50 p-6 rounded-xl"><h3 className="font-bold mb-2">Commercial Electrical</h3><p className="text-slate-600 text-sm">Office and retail electrical systems</p></div>
            <div className="bg-yellow-50 p-6 rounded-xl"><h3 className="font-bold mb-2">Safety Training</h3><p className="text-slate-600 text-sm">OSHA and electrical safety protocols</p></div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-gradient-to-br from-yellow-700 to-yellow-900 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Start Your Electrical Career</h2>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
          <Link href="/check-eligibility" className="bg-brand-orange-500 text-white font-bold py-4 px-8 rounded-lg hover:bg-brand-orange-600">Check Eligibility</Link>
          <Link href="/contact" className="bg-white text-yellow-700 font-bold py-4 px-8 rounded-lg hover:bg-yellow-50">Contact an Advisor</Link>
        </div>
      </section>
    </div>
  );
}

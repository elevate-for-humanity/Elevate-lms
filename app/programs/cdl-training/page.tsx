import { Metadata } from 'next';
import Link from 'next/link';
import { Truck, Clock, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'CDL Truck Driving Training | Elevate for Humanity',
  description: 'Get your Commercial Driver\'s License (CDL) and start a career in trucking. Class A and Class B CDL training available.',
};

export default function CDLPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-blue-900 to-blue-950 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <span className="bg-blue-700 text-white text-sm px-3 py-1 rounded-full">Transportation</span>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-4">CDL Training</h1>
          <p className="text-xl text-blue-200 max-w-2xl mb-6">Get your Commercial Driver&apos;s License and start a career in trucking. High demand, great pay, home nightly.</p>
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm"><Clock className="w-4 h-4" />4-8 weeks</span>
            <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm"><Award className="w-4 h-4" />Class A & B CDL</span>
            <span className="flex items-center gap-2 bg-brand-orange-500 px-4 py-2 rounded-full text-sm font-semibold">WIOA Funding</span>
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">About This Program</h2>
          <p className="text-lg text-slate-700 mb-6">CDL truck drivers are in high demand across the country. This program prepares you for the CDL exam with both classroom instruction and behind-the-wheel training.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Truck className="w-5 h-5 text-blue-600" />Class A CDL</h3>
              <p className="text-slate-600 text-sm">Tractor-trailers, combination vehicles. Highest earning potential and most job opportunities.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="font-bold mb-4">Class B CDL</h3>
              <p className="text-slate-600 text-sm">Straight trucks, buses, delivery vehicles. Great for local routes and home nightly.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-blue-50 rounded-xl"><div className="text-3xl font-bold text-blue-600">$50K+</div><div className="text-sm text-slate-600">Avg First Year</div></div>
            <div className="p-6 bg-blue-50 rounded-xl"><div className="text-3xl font-bold text-blue-600">4-8</div><div className="text-sm text-slate-600">Weeks</div></div>
            <div className="p-6 bg-green-50 rounded-xl"><div className="text-3xl font-bold text-green-600">90%+</div><div className="text-sm text-slate-600">Pass Rate</div></div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-gradient-to-br from-blue-900 to-blue-950 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Start Your Trucking Career</h2>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
          <Link href="/check-eligibility" className="bg-brand-orange-500 text-white font-bold py-4 px-8 rounded-lg hover:bg-brand-orange-600">Check Eligibility</Link>
          <Link href="/contact" className="bg-white text-blue-900 font-bold py-4 px-8 rounded-lg hover:bg-blue-50">Contact an Advisor</Link>
        </div>
      </section>
    </div>
  );
}

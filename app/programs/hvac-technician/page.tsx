import { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Award, DollarSign, Wrench, CheckCircle2, Thermometer } from 'lucide-react';

export const metadata: Metadata = {
  title: 'HVAC Technician Training | Elevate for Humanity',
  description: 'Learn HVAC installation, repair, and EPA 608 certification. Start your skilled trades career with hands-on training.',
};

export default function HVACPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-blue-800 to-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <span className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full">Skilled Trades</span>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-4">HVAC Technician</h1>
          <p className="text-xl text-blue-100 max-w-2xl mb-6">Master heating, ventilation, air conditioning, and refrigeration systems. EPA 608 certification included.</p>
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm"><Clock className="w-4 h-4" />6-12 months</span>
            <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm"><Award className="w-4 h-4" />EPA 608 Certified</span>
            <span className="flex items-center gap-2 bg-brand-orange-500 px-4 py-2 rounded-full text-sm font-semibold">WIOA Funding</span>
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">About This Program</h2>
          <p className="text-lg text-slate-700 mb-6">The HVAC Technician program prepares you for entry-level positions in residential and commercial heating, ventilation, air conditioning, and refrigeration. You&apos;ll learn system installation, troubleshooting, maintenance, and safety procedures.</p>
          <p className="text-lg text-slate-700 mb-8">EPA 608 certification is included — required by law to work with refrigerants. Graduates can work as HVAC installers, service technicians, or maintenance specialists.</p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-6 rounded-xl"><h3 className="font-bold mb-2">Heating Systems</h3><p className="text-slate-600 text-sm">Gas, electric, and heat pump heating systems</p></div>
            <div className="bg-blue-50 p-6 rounded-xl"><h3 className="font-bold mb-2">Cooling Systems</h3><p className="text-slate-600 text-sm">AC units, refrigeration, and chillers</p></div>
            <div className="bg-blue-50 p-6 rounded-xl"><h3 className="font-bold mb-2">EPA 608 Prep</h3><p className="text-slate-600 text-sm">Universal certification exam preparation</p></div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Career Outcomes</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 bg-slate-50 rounded-xl"><div className="text-3xl font-bold text-blue-600">$45K+</div><div className="text-sm text-slate-600">Starting Salary</div></div>
            <div className="p-6 bg-slate-50 rounded-xl"><div className="text-3xl font-bold text-blue-600">6-12</div><div className="text-sm text-slate-600">Months to Complete</div></div>
            <div className="p-6 bg-slate-50 rounded-xl"><div className="text-3xl font-bold text-green-600">High</div><div className="text-sm text-slate-600">Job Demand</div></div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-green-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-slate-600 mb-6">WIOA funding may cover 100% of tuition for eligible participants.</p>
          <Link href="/check-eligibility" className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700">Check Eligibility</Link>
        </div>
      </section>
      <section className="py-16 bg-gradient-to-br from-blue-800 to-blue-900 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Start Your HVAC Career</h2>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
          <Link href="/check-eligibility" className="bg-brand-orange-500 text-white font-bold py-4 px-8 rounded-lg hover:bg-brand-orange-600">Check Eligibility</Link>
          <Link href="/contact" className="bg-white text-blue-700 font-bold py-4 px-8 rounded-lg hover:bg-blue-50">Contact an Advisor</Link>
        </div>
      </section>
    </div>
  );
}

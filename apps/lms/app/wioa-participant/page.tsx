import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Users, DollarSign, Clock, Award, FileCheck, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'WIOA Participant Resources | Elevate for Humanity',
  description: 'Resources and information for WIOA-funded participants.',
};

const wioaServices = [
  { title: 'Tuition Assistance', description: 'WIOA funding may cover up to 100% of tuition for eligible participants.', icon: DollarSign },
  { title: 'Career Counseling', description: 'One-on-one career guidance and job placement support.', icon: Users },
  { title: 'Training Materials', description: 'Books, supplies, and equipment needed for your program.', icon: Award },
  { title: 'Support Services', description: 'Transportation assistance, childcare, and other support as needed.', icon: FileCheck },
];

export default function WIOAParticipantPage() {
  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[{ label: 'Resources', href: '/resources' }, { label: 'WIOA Participant' }]} />
      
      {/* Header */}
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-bold mb-4">
            <Award className="w-4 h-4" />
            WIOA Funded
          </div>
          <h1 className="text-3xl font-bold mb-4">WIOA Participant Resources</h1>
          <p className="text-blue-100 max-w-2xl">
            Welcome! As a WIOA-funded participant, you have access to specialized support services and funding for your training.
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-bold text-black mb-6">Your WIOA Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wioaServices.map((service) => (
              <div key={service.title} className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <service.icon className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-black">{service.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{service.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Important Info */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h3 className="font-bold text-amber-900 mb-2">Important Information</h3>
            <ul className="text-sm text-amber-800 space-y-2">
              <li>• Maintain regular contact with your case manager</li>
              <li>• Attend all scheduled appointments and training sessions</li>
              <li>• Report any changes to your situation immediately</li>
              <li>• Keep copies of all documentation and receipts</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-8 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-xl font-bold text-black mb-4">Questions About Your WIOA Funding?</h2>
          <p className="text-slate-600 mb-6">
            Contact your WorkOne case manager or our participant support team.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/contact" className="bg-brand-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-brand-blue-700">
              Contact Support
            </Link>
            <Link href="/lms" className="bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-lg hover:bg-slate-300">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

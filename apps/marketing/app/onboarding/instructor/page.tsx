import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Instructor Onboarding,
  description: 'Welcome to the Elevate instructor team. Get started with your instructor onboarding journey.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Instructor Onboarding</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Welcome to the Elevate team! Follow these steps to get started as an instructor.</p>
        </div>
      </section>
      
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Getting Started Checklist</h2>
            <div className="space-y-4">
              {[
                { step: '1', title: 'Complete Your Profile', desc: 'Add your photo, bio, credentials, and areas of expertise.' },
                { step: '2', title: 'Review Instructor Handbook', desc: 'Familiarize yourself with our teaching standards and policies.' },
                { step: '3', title: 'Complete Compliance Training', desc: 'Finish required FERPA and harassment prevention training.' },
                { step: '4', title: 'Set Up Your Classroom', desc: 'Configure your virtual classroom and upload course materials.' },
                { step: '5', title: 'Schedule Orientation Call', desc: 'Meet with our curriculum team to discuss your first course.' },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 bg-brand-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{item.title}</h4>
                    <p className="text-slate-600 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Resources</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/instructor/handbook" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <p className="font-medium text-slate-900">Instructor Handbook</p>
                <p className="text-slate-500 text-sm">Teaching standards and policies</p>
              </Link>
              <Link href="/instructor/calendar" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <p className="font-medium text-slate-900">Academic Calendar</p>
                <p className="text-slate-500 text-sm">Important dates and deadlines</p>
              </Link>
              <Link href="/instructor/curriculum" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <p className="font-medium text-slate-900">Curriculum Guide</p>
                <p className="text-slate-500 text-sm">Course templates and standards</p>
              </Link>
              <Link href="/contact" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <p className="font-medium text-slate-900">Get Help</p>
                <p className="text-slate-500 text-sm">Contact support for assistance</p>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

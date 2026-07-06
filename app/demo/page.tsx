import { Metadata } from 'next';
import Link from 'next/link';
import { Play, Monitor, Users, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Request a Demo | Elevate for Humanity',
  description: 'Schedule a demo of the Elevate workforce development platform.',
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Request a Demo</h1>
          <p className="text-blue-200">See the Elevate platform in action.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center">What You&apos;ll See</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="flex items-start gap-4">
                <Monitor className="w-8 h-8 text-brand-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold">Student Dashboard</h3>
                  <p className="text-slate-600 text-sm">Track progress, courses, and credentials.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Users className="w-8 h-8 text-brand-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold">Admin Tools</h3>
                  <p className="text-slate-600 text-sm">Manage enrollments and track outcomes.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Award className="w-8 h-8 text-brand-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold">Credential System</h3>
                  <p className="text-slate-600 text-sm">Issue and verify credentials.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Play className="w-8 h-8 text-brand-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold">AI Features</h3>
                  <p className="text-slate-600 text-sm">Intelligent career matching and advising.</p>
                </div>
              </div>
            </div>
            <form className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Name</label><input type="text" className="w-full border rounded-lg px-4 py-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" className="w-full border rounded-lg px-4 py-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Organization</label><input type="text" className="w-full border rounded-lg px-4 py-2" /></div>
              <button type="submit" className="w-full bg-brand-blue-600 text-white font-bold py-3 rounded-lg hover:bg-brand-blue-700">Request Demo</button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

import { Metadata } from 'next';
import { Clock, ArrowRight } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `CNA Waitlist | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Join the waitlist for our CNA certification program.',
};

export default function CNAWaitlistPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">CNA Program Waitlist</h1>
          <p className="text-xl text-blue-100">Join our waitlist to be notified when enrollment opens.</p>
        </div>
      </section>
      
      <section className="py-16 px-6">
        <div className="max-w-xl mx-auto">
          <div className="bg-white p-8 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-blue-600" />
              <span className="text-slate-600">High demand program</span>
            </div>
            <h2 className="text-2xl font-bold mb-4">Join the Waitlist</h2>
            <form className="space-y-4">
              <input type="email" placeholder="Your email" className="w-full px-4 py-3 border rounded-lg" />
              <input type="tel" placeholder="Your phone" className="w-full px-4 py-3 border rounded-lg" />
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2">
                Join Waitlist <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

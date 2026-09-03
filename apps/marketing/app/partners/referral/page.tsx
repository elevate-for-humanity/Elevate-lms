import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Refer a Student | Elevate for Humanity',
  description: 'Refer someone to Elevate workforce training programs and help transform lives through career-focused education.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium">Earn Rewards</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Refer a Student, Earn Rewards</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Help someone in your community access life-changing workforce training and earn rewards for your referral.</p>
        </div>
      </section>
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">How the Referral Program Works</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-brand-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xl">1</div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-lg">Submit a Referral</h4>
                    <p className="text-slate-600">Fill out our simple referral form with the candidate's contact information and career interests.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-brand-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xl">2</div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-lg">We Make Contact</h4>
                    <p className="text-slate-600">Our admissions team reaches out to guide them through the application process.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-brand-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xl">3</div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-lg">They Enroll</h4>
                    <p className="text-slate-600">When your referral completes enrollment, you earn a reward for connecting them with opportunity.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Referral Rewards</h3>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-16 h-16 bg-brand-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🎓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Training Enrollment</p>
                    <p className="text-brand-blue-600 font-bold">$100 Gift Card</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">💼</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Graduate & Employed</p>
                    <p className="text-brand-blue-600 font-bold">$250 Bonus</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-6">Rewards paid via gift card (Amazon, Visa, or retailer of your choice) within 30 days of referral milestones.</p>
              <Link href="/partners/join" className="block w-full text-center bg-brand-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-brand-blue-700 transition-colors">
                Submit a Referral
              </Link>
            </div>
          </div>
          
          <div className="bg-brand-blue-700 rounded-2xl p-8 md:p-12 text-white mb-16">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Who Should You Refer?</h2>
              <p className="text-xl text-blue-100 mb-8">Anyone looking to start or advance their career in high-demand fields.</p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  <h4 className="font-semibold">Career Changers</h4>
                  <p className="text-blue-200 text-sm">Looking for a new direction</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
                  </div>
                  <h4 className="font-semibold">Recent Grads</h4>
                  <p className="text-blue-200 text-sm">Ready for the workforce</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <h4 className="font-semibold">Displaced Workers</h4>
                  <p className="text-blue-200 text-sm">Seeking new skills</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Make a Difference?</h2>
            <p className="text-slate-600 mb-8 max-w-2xl mx-auto">Help someone take the first step toward their dream career. Your referral could change their life.</p>
            <Link href="/partners/join" className="inline-block bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700 transition-colors">
              Submit a Referral Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

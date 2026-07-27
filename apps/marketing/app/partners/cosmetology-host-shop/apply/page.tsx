import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cosmetology Host Shop Application | Elevate for Humanity',
  description: 'Apply to become a host shop for our cosmetology apprenticeship program. Train future beauty professionals.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium">Beauty Apprenticeship</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Become a Cosmetology Host Shop</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Partner with Elevate to host cosmetology apprentices in your salon. Grow your team while giving back to your community.</p>
        </div>
      </section>
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Why Become a Host Shop?</h2>
              <div className="space-y-4">
                {[
                  { icon: '💰', title: 'Tax Credits', desc: 'Claim tax incentives for participating in registered apprenticeships' },
                  { icon: '👥', title: 'Pre-Trained Talent', desc: 'Hire apprentices who already have foundational skills' },
                  { icon: '📚', title: 'We Handle the Classroom', desc: 'Our team provides all classroom instruction and curriculum' },
                  { icon: '⭐', title: 'Build Your Reputation', desc: 'Mentor the next generation and strengthen the industry' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 bg-white rounded-xl p-6 shadow-sm">
                    <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">{item.icon}</span>
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
              <h3 className="text-xl font-bold text-slate-900 mb-6">Host Shop Requirements</h3>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3 text-slate-600 text-sm">
                  <span className="text-green-600 font-bold">✓</span>
                  Licensed salon or spa in good standing
                </li>
                <li className="flex items-start gap-3 text-slate-600 text-sm">
                  <span className="text-green-600 font-bold">✓</span>
                  Licensed cosmetologist to serve as mentor
                </li>
                <li className="flex items-start gap-3 text-slate-600 text-sm">
                  <span className="text-green-600 font-bold">✓</span>
                  Space for apprentice to practice skills
                </li>
                <li className="flex items-start gap-3 text-slate-600 text-sm">
                  <span className="text-green-600 font-bold">✓</span>
                  Willingness to use RTI tracking system
                </li>
              </ul>
              
              <h3 className="text-xl font-bold text-slate-900 mb-6">Ready to Apply?</h3>
              <Link href="/contact" className="block w-full text-center bg-brand-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-brand-blue-700 transition-colors">
                Apply Now
              </Link>
              <p className="text-center text-slate-500 text-sm mt-4">Questions? Call (317) 314-3757</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

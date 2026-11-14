import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Esthetician Apprenticeship | Elevate for Humanity',
  description: 'Apply for our esthetician apprenticeship program. Learn skin care while earning and get licensed.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium">Beauty Apprenticeship</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Esthetician Apprenticeship</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Learn the art of skincare while earning. Our esthetician apprenticeship combines hands-on training with classroom instruction.</p>
        </div>
      </section>
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Program Overview</h2>
              <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
                <p className="text-slate-600 mb-4">Our esthetician apprenticeship program prepares you for a career in skincare. You'll learn facials, chemical peels, microdermabrasion, and more while working in a licensed spa or salon.</p>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-brand-blue-600">20</div>
                    <div className="text-slate-600 text-sm">Appendix A Competencies</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-brand-blue-600">300</div>
                    <div className="text-slate-600 text-sm">Required RTI Hours</div>
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-4">What You'll Learn</h3>
              <div className="space-y-2">
                {['Facial treatments and protocols', 'Chemical peels and exfoliation', 'Microdermabrasion', 'Waxing and hair removal', 'Skin analysis', 'Product knowledge', 'Sanitation and safety', 'Client consultation'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-slate-600 text-sm">
                    <span className="w-2 h-2 bg-brand-blue-600 rounded-full" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-6">How to Apply</h3>
              <div className="space-y-4 mb-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">1</div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Complete Application</h4>
                    <p className="text-slate-600 text-sm">Fill out our online application form.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">2</div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Interview</h4>
                    <p className="text-slate-600 text-sm">Meet with our admissions team.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">3</div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Host Shop Placement</h4>
                    <p className="text-slate-600 text-sm">We'll match you with a host salon.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">4</div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Start Training</h4>
                    <p className="text-slate-600 text-sm">Begin your apprenticeship journey!</p>
                  </div>
                </div>
              </div>
              <Link href="/apply" className="block w-full text-center bg-brand-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-brand-blue-700 transition-colors">
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

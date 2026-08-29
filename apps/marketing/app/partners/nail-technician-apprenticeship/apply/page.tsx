import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Nail Technician Apprenticeship,
  description: 'Apply for our nail technician apprenticeship program. Learn manicures, pedicures, and nail art while earning.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium">Beauty Apprenticeship</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Nail Technician Apprenticeship</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Start your career in nail care. Learn manicures, pedicures, gel, and nail art while earning in a real salon.</p>
        </div>
      </section>
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Program Highlights</h2>
              <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
                <p className="text-slate-600 mb-4">Our nail technician apprenticeship program combines classroom instruction with hands-on salon experience. You'll learn from licensed professionals while building your client base.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                  <div className="text-3xl font-bold text-brand-blue-600 mb-2">8-12</div>
                  <div className="text-slate-600 text-sm">Months</div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                  <div className="text-3xl font-bold text-brand-blue-600 mb-2">500+</div>
                  <div className="text-slate-600 text-sm">Training Hours</div>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-4">Skills You'll Master</h3>
              <div className="space-y-2">
                {['Manicures and pedicures', 'Gel and acrylic nails', 'Nail art and design', 'Sanitation protocols', 'Client consultation', 'Product knowledge'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-slate-600 text-sm">
                    <span className="w-2 h-2 bg-brand-blue-600 rounded-full" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Ready to Start?</h3>
              <p className="text-slate-600 mb-6">Apply today and start your journey to becoming a licensed nail technician.</p>
              <Link href="/apply" className="block w-full text-center bg-brand-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-brand-blue-700 transition-colors mb-4">
                Apply Now
              </Link>
              <div className="border-t border-slate-200 pt-6">
                <h4 className="font-semibold text-slate-900 mb-3">Questions?</h4>
                <p className="text-slate-600 text-sm mb-2">Call or text our admissions team:</p>
                <a href="tel:+13173143757" className="text-brand-blue-600 font-bold text-lg">(317) 314-3757</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

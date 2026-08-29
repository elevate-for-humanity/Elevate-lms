import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Custom Program Development,
  description: 'Work with us to create a custom workforce training program tailored to your industry and organizational needs.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium">Custom Solutions</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Create a Custom Program</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Partner with us to design a workforce training program that meets your specific industry requirements and organizational goals.</p>
        </div>
      </section>
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Process</h2>
            <p className="text-xl text-slate-600">From concept to launch, we work with you every step of the way.</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h4 className="font-bold text-slate-900 mb-2">Discovery</h4>
              <p className="text-slate-600 text-sm">We analyze your workforce needs, skill gaps, and industry requirements.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h4 className="font-bold text-slate-900 mb-2">Design</h4>
              <p className="text-slate-600 text-sm">Our curriculum experts create a customized training blueprint.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h4 className="font-bold text-slate-900 mb-2">Develop</h4>
              <p className="text-slate-600 text-sm">We build course materials, assessments, and certification exams.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">4</span>
              </div>
              <h4 className="font-bold text-slate-900 mb-2">Deploy</h4>
              <p className="text-slate-600 text-sm">Launch your program with our LMS, support, and ongoing optimization.</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm mb-16">
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-6">What We Customize</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Curriculum & Content</h4>
                      <p className="text-slate-600 text-sm">Industry-specific skills, compliance requirements, and job-relevant competencies.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Delivery Format</h4>
                      <p className="text-slate-600 text-sm">Online, in-person, hybrid, or employer on-site training options.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Assessments</h4>
                      <p className="text-slate-600 text-sm">Custom exams, practical evaluations, and competency tracking.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Branding</h4>
                      <p className="text-slate-600 text-sm">White-label options with your organization's branding and identity.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-6">Industries We've Served</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4 text-center">
                    <span className="text-2xl mb-2 block">🏥</span>
                    <span className="font-medium text-slate-900 text-sm">Healthcare</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 text-center">
                    <span className="text-2xl mb-2 block">🏭</span>
                    <span className="font-medium text-slate-900 text-sm">Manufacturing</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 text-center">
                    <span className="text-2xl mb-2 block">🚚</span>
                    <span className="font-medium text-slate-900 text-sm">Logistics</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 text-center">
                    <span className="text-2xl mb-2 block">🏗️</span>
                    <span className="font-medium text-slate-900 text-sm">Construction</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 text-center">
                    <span className="text-2xl mb-2 block">💼</span>
                    <span className="font-medium text-slate-900 text-sm">Business</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 text-center">
                    <span className="text-2xl mb-2 block">✂️</span>
                    <span className="font-medium text-slate-900 text-sm">Beauty</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-brand-blue-700 rounded-2xl p-8 md:p-12 text-white mb-16">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Build Your Program?</h2>
              <p className="text-xl text-blue-100 mb-8">Let's discuss your workforce training needs and create a program that delivers results.</p>
              <Link href="/contact" className="inline-block bg-white text-brand-blue-700 font-bold py-3 px-8 rounded-lg hover:bg-blue-50 transition-colors">
                Schedule a Consultation
              </Link>
            </div>
          </div>
          
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Why Companies Choose Custom Programs</h3>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div>
                <div className="text-3xl font-bold text-brand-blue-600 mb-2">40%</div>
                <p className="text-slate-600 text-sm">Faster time-to-competency compared to generic training</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-brand-blue-600 mb-2">60%</div>
                <p className="text-slate-600 text-sm">Reduction in training-related turnover</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-brand-blue-600 mb-2">3x</div>
                <p className="text-slate-600 text-sm">ROI on workforce development investment</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

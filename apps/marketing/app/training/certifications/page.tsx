import { Metadata } from 'next';
import Link from 'next/link';
import { Award, CheckCircle, ExternalLink, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Certifications | Training',
  keywords: ["certifications", "credentials", "licenses", "testing", "exams"],
  description: 'Earn industry-recognized certifications through our testing center. NHA, Certiport, EPA 608, and more.',
};

export default function TrainingCertificationsPage() {
  const certifications = [
    { name: 'NHA Certifications', provider: 'National Healthcareer Association', exams: ['CPhT', 'CCMA', 'Phlebotomy Tech', 'EKG Tech'], valid: '2 years' },
    { name: 'Certiport Certifications', provider: 'Certiport / Pearson VUE', exams: ['MOS Excel', 'MOS Word', 'IC3', 'A+'], valid: 'Varies' },
    { name: 'EPA 608 Certification', provider: 'EPA', exams: ['Universal', 'Type I', 'Type II', 'Type III'], valid: 'Lifetime' },
    { name: 'CPR / First Aid', provider: 'American Heart Association', exams: ['BLS', 'Heartsaver', 'First Aid'], valid: '2 years' },
    { name: 'OSHA 10-Hour', provider: 'OSHA', exams: ['Construction', 'General Industry'], valid: 'Lifetime' },
    { name: 'CareerSafe', provider: 'CareerSafe', exams: ['OSHA 10-Hour', 'Youth Safety'], valid: 'Lifetime' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-brand-blue-800 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-red-500 to-brand-orange-500" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-brand-red-500/20 text-brand-red-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Award className="w-4 h-4" />
              Testing Center
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Industry Certifications
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              Earn credentials that employers recognize. Our testing center offers proctored exams for healthcare, trades, technology, and safety certifications.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/testing/book" className="inline-flex items-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                Schedule Exam
              </Link>
              <Link href="/programs" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-brand-blue-900 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                View Training Programs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications Grid */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-4">Available Certifications</h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">Industry-recognized credentials to boost your career.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certifications.map((cert) => (
              <div key={cert.name} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg hover:border-brand-blue-200 transition-all">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-brand-blue-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{cert.name}</h3>
                <p className="text-sm text-slate-500 mb-3">{cert.provider}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {cert.exams.map((exam) => (
                    <span key={exam} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{exam}</span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Shield className="w-3 h-3" />
                  Valid for: {cert.valid}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Get Certified */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-12">Why Get Certified?</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { title: 'Higher Earning Potential', desc: 'Certified professionals earn an average of 25% more than non-certified workers in the same field.' },
              { title: 'Job Security', desc: 'Certifications demonstrate verified skills that employers trust and value.' },
              { title: 'Career Advancement', desc: 'Credentials open doors to promotions, supervisory roles, and specialized positions.' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-16 h-16 bg-brand-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-brand-red-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-50 border-y border-brand-blue-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Get Certified?</h2>
          <p className="text-slate-600 mb-8">Schedule your exam at our testing center or enroll in a training program first.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/testing/book" className="inline-flex items-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Schedule Exam
            </Link>
            <Link href="/programs" className="inline-flex items-center border-2 border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-4 px-8 rounded-lg transition-colors">
              View Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

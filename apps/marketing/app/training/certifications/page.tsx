import { Metadata } from 'next';
import Link from 'next/link';
import { Award, CheckCircle, Shield } from 'lucide-react';
import PictureFirstPageHero from '@/components/site/PictureFirstPageHero';

export const metadata: Metadata = {
  title: 'Certifications | Training',
  keywords: ['certifications', 'credentials', 'licenses', 'testing', 'exams'],
  description: 'Explore industry certification and testing options available through Elevate programs and testing partnerships.',
};

export default function TrainingCertificationsPage() {
  const certifications = [
    { name: 'Healthcare Certifications', provider: 'Approved testing partners', exams: ['Medical Assisting', 'Phlebotomy', 'Pharmacy Technician', 'EKG'], valid: 'Varies by credential' },
    { name: 'Digital & Office Certifications', provider: 'Approved testing partners', exams: ['Microsoft Office', 'Digital Literacy', 'Business Applications'], valid: 'Varies by credential' },
    { name: 'EPA 608 Certification', provider: 'EPA-approved testing pathway', exams: ['Core', 'Type I', 'Type II', 'Type III', 'Universal'], valid: 'Credential-specific' },
    { name: 'CPR / First Aid', provider: 'Approved training/testing partner', exams: ['CPR', 'First Aid', 'BLS where offered'], valid: 'Credential-specific' },
    { name: 'Workplace Safety', provider: 'Approved safety training partners', exams: ['OSHA-aligned safety', 'Youth Safety', 'Industry Safety'], valid: 'Credential-specific' },
    { name: 'Career Readiness', provider: 'Approved workforce/testing partners', exams: ['Work readiness', 'Employability', 'Career skills'], valid: 'Credential-specific' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <PictureFirstPageHero
        image="/images/heroes/training-provider-2.webp"
        alt="Learners preparing for industry certification testing"
        eyebrow="Testing & Credentials"
        title="Industry Certifications"
        description="Prepare for credentials employers recognize. Certification availability depends on the program, testing partner, eligibility, and current exam requirements."
        actions={(
          <>
            <Link href="/testing/book" className="inline-flex items-center rounded-lg bg-brand-red-600 px-7 py-3 font-bold text-white transition-colors hover:bg-brand-red-700">Schedule Testing</Link>
            <Link href="/programs" className="inline-flex items-center rounded-lg border-2 border-slate-300 bg-white px-7 py-3 font-bold text-slate-900 transition-colors hover:border-slate-500">View Training Programs</Link>
          </>
        )}
      />

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-center text-2xl font-bold text-slate-950 md:text-3xl">Certification Pathways</h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-slate-700">Exam and credential options vary by occupation and testing-provider authorization.</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {certifications.map((cert) => (
              <div key={cert.name} className="rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-brand-blue-200 hover:shadow-lg">
                <Award className="mb-4 h-8 w-8 text-brand-blue-700" />
                <h3 className="mb-1 font-bold text-slate-950">{cert.name}</h3>
                <p className="mb-3 text-sm font-medium text-slate-600">{cert.provider}</p>
                <div className="mb-4 flex flex-wrap gap-1">
                  {cert.exams.map((exam) => <span key={exam} className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{exam}</span>)}
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600"><Shield className="h-3 w-3" /> {cert.valid}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-2xl font-bold text-slate-950 md:text-3xl">Why Credentials Matter</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { title: 'Verified Skills', desc: 'Credentials document that you met the testing or competency requirements for that certification.' },
              { title: 'Employer Readiness', desc: 'Many occupations use certifications to verify safety, technical, healthcare, or software knowledge.' },
              { title: 'Career Progression', desc: 'Some credentials are prerequisites for employment, advancement, licensing, or additional training.' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <CheckCircle className="mx-auto mb-4 h-10 w-10 text-brand-green-700" />
                <h3 className="mb-2 font-bold text-slate-950">{item.title}</h3>
                <p className="text-sm text-slate-700">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-brand-blue-100 bg-brand-blue-50 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-950">Ready to Prepare or Test?</h2>
          <p className="mb-8 text-slate-700">Check the testing page for current availability or enroll in the related training program first.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/testing/book" className="inline-flex items-center rounded-lg bg-brand-blue-700 px-8 py-4 font-bold text-white transition-colors hover:bg-brand-blue-800">Testing Options</Link>
            <Link href="/programs" className="inline-flex items-center rounded-lg border-2 border-slate-300 bg-white px-8 py-4 font-bold text-slate-800 transition-colors hover:border-slate-500">View Programs</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

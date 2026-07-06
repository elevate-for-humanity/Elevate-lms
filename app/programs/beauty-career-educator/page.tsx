import { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Award, DollarSign, Users, CheckCircle2, Scissors, GraduationCap, Briefcase } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Beauty & Career Educator | Elevate for Humanity',
  description: 'Train to become a beauty industry educator. Learn instructional design, curriculum delivery, and professional development for cosmetology schools.',
};

export default function BeautyCareerEducatorPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-pink-700 via-rose-600 to-pink-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-block bg-pink-500 text-white text-sm font-semibold px-3 py-1 rounded-full mb-4">
            Beauty & Education
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Beauty & Career Educator
          </h1>
          <p className="text-xl text-pink-100 max-w-2xl mb-6">
            Become a licensed beauty educator and shape the next generation of stylists, barbers, and estheticians.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm">
              <Award className="w-4 h-4" />State Licensed
            </span>
            <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm">
              <Clock className="w-4 h-4" />12-16 weeks
            </span>
            <span className="flex items-center gap-2 bg-brand-orange-500 px-4 py-2 rounded-full text-sm font-semibold">
              WIOA Funding Available
            </span>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">About This Program</h2>
          <p className="text-lg text-slate-700 leading-relaxed mb-6">
            The Beauty & Career Educator program prepares licensed cosmetologists, barbers, and estheticians to become professional educators in the beauty industry.
          </p>
          <p className="text-lg text-slate-700 leading-relaxed">
            Learn instructional design, teaching methodology, student assessment, and state board examination preparation. Graduates qualify to teach in cosmetology schools, barber academies, and esthetics programs.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">What You&apos;ll Learn</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl">Instructional Design & Curriculum Development</div>
            <div className="p-4 bg-slate-50 rounded-xl">Teaching Methodology for Beauty</div>
            <div className="p-4 bg-slate-50 rounded-xl">Student Assessment & Testing</div>
            <div className="p-4 bg-slate-50 rounded-xl">Hands-on Demonstration Skills</div>
            <div className="p-4 bg-slate-50 rounded-xl">Classroom Management</div>
            <div className="p-4 bg-slate-50 rounded-xl">State Board Exam Preparation</div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-green-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Funding Options</h2>
          <p className="text-slate-600 mb-6">WIOA funding may cover 100% of tuition for eligible participants.</p>
          <Link href="/check-eligibility" className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700">
            Check Eligibility
          </Link>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-pink-700 to-pink-900 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Inspire the Next Generation?</h2>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
          <Link href="/check-eligibility" className="bg-brand-orange-500 text-white font-bold py-4 px-8 rounded-lg hover:bg-brand-orange-600">
            Check Eligibility
          </Link>
          <Link href="/contact" className="bg-white text-pink-700 font-bold py-4 px-8 rounded-lg hover:bg-pink-50">
            Contact an Advisor
          </Link>
        </div>
      </section>
    </div>
  );
}

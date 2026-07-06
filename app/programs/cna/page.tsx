import { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Award, Heart, Users, DollarSign, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'CNA Training | Certified Nursing Assistant | Elevate for Humanity',
  description: 'Start your healthcare career with CNA training. 4-8 week programs with WIOA funding available. Work in hospitals, nursing homes, and home health.',
};

export default function CNAPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-teal-700 to-teal-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-block bg-teal-500 text-white text-sm font-semibold px-3 py-1 rounded-full mb-4">
            Healthcare
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Certified Nursing Assistant</h1>
          <p className="text-xl text-teal-100 max-w-2xl mb-6">
            Start your healthcare career in just 4-8 weeks. CNAs are in high demand at hospitals, nursing homes, and home health agencies.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm">
              <Clock className="w-4 h-4" />4-8 weeks
            </span>
            <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm">
              <Award className="w-4 h-4" />State Certification
            </span>
            <span className="flex items-center gap-2 bg-brand-orange-500 px-4 py-2 rounded-full text-sm font-semibold">
              WIOA Funding Available
            </span>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white border-b">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-teal-600">$28K+</div>
              <div className="text-sm text-slate-600">Starting Salary</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-teal-600">100%</div>
              <div className="text-sm text-slate-600">WIOA Eligible</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-teal-600">High</div>
              <div className="text-sm text-slate-600">Job Demand</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-teal-600">4-8</div>
              <div className="text-sm text-slate-600">Weeks</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">About This Program</h2>
          <p className="text-lg text-slate-700 leading-relaxed mb-6">
            The Certified Nursing Assistant program prepares you to provide basic patient care under the direction of registered nurses. 
            You&apos;ll learn vital signs, personal care, infection control, and communication skills.
          </p>
          <p className="text-lg text-slate-700 leading-relaxed">
            Upon completion, you&apos;ll be eligible to take the Indiana CNA state exam. Once certified, you can work in hospitals, 
            nursing homes, assisted living facilities, and home health agencies.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">What You&apos;ll Learn</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex gap-3 p-4 bg-teal-50 rounded-xl">
              <Heart className="w-6 h-6 text-teal-600 flex-shrink-0" />
              <span>Basic patient care and hygiene</span>
            </div>
            <div className="flex gap-3 p-4 bg-teal-50 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-teal-600 flex-shrink-0" />
              <span>Vital signs measurement</span>
            </div>
            <div className="flex gap-3 p-4 bg-teal-50 rounded-xl">
              <Users className="w-6 h-6 text-teal-600 flex-shrink-0" />
              <span>Communication and patient relations</span>
            </div>
            <div className="flex gap-3 p-4 bg-teal-50 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-teal-600 flex-shrink-0" />
              <span>Infection control procedures</span>
            </div>
            <div className="flex gap-3 p-4 bg-teal-50 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-teal-600 flex-shrink-0" />
              <span>Feeding and nutrition assistance</span>
            </div>
            <div className="flex gap-3 p-4 bg-teal-50 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-teal-600 flex-shrink-0" />
              <span>State exam preparation</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-green-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Funding Options</h2>
          <p className="text-slate-600 mb-6">WIOA funding may cover 100% of tuition. Check your eligibility today.</p>
          <Link href="/check-eligibility" className="bg-teal-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-teal-700">
            Check Eligibility
          </Link>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-teal-700 to-teal-900 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Start Your Healthcare Career</h2>
        <p className="text-xl text-teal-100 mb-6">CNAs are in high demand. Apply today.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/check-eligibility" className="bg-brand-orange-500 text-white font-bold py-4 px-8 rounded-lg hover:bg-brand-orange-600">
            Check Eligibility
          </Link>
          <Link href="/contact" className="bg-white text-teal-700 font-bold py-4 px-8 rounded-lg hover:bg-teal-50">
            Contact an Advisor
          </Link>
        </div>
      </section>
    </div>
  );
}

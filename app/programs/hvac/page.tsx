import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import PageAvatar from '@/components/PageAvatar';
import { CheckCircle, DollarSign, Award, Briefcase, ArrowRight, GraduationCap, Users, Shield, Building2, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'HVAC Technician Training | Free Through WRG | Elevate for Humanity',
  description: 'Free HVAC training through Indiana Workforce Ready Grant. No debt, no gimmicks. Become a certified HVAC technician.',
};

export default function HVACProgramPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* HERO VIDEO */}
      <section className="relative h-[60vh] min-h-[400px]">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/videos/hvac-hero-final.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40" />
      </section>

      {/* AVATAR */}
      <PageAvatar videoSrc="/videos/hero-hvac-avatar.mp4" title="Your HVAC Career Starts Here" />

      {/* NO DEBT BANNER */}
      <section className="bg-green-600 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xl font-bold">NO TUITION. NO DEBT. NO GIMMICKS.</p>
          <p className="text-green-100">100% funded through Indiana's Workforce Ready Grant for eligible participants</p>
        </div>
      </section>

      {/* PROGRAM OVERVIEW */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-6">HVAC Technician Training Program</h1>
            <p className="text-lg text-slate-600 mb-6">
              Heating, Ventilation, and Air Conditioning (HVAC) technicians install, maintain, and repair climate control systems in homes and businesses. This is a high-demand trade with excellent pay and job security.
            </p>
            <p className="text-lg text-slate-600 mb-6">
              Our program takes you from zero experience to job-ready in 12-16 weeks. You'll learn online first, then get hands-on training in our lab, and finish with paid on-the-job training with a local employer.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">$0</div>
                <div className="text-sm text-slate-600">Your Cost</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <Award className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">EPA 608</div>
                <div className="text-sm text-slate-600">Certified</div>
              </div>
            </div>
          </div>
          <div className="relative h-96 rounded-2xl overflow-hidden">
            <Image src="/images/programs/hvac-technician.jpg" alt="HVAC Technician at Work" fill className="object-cover" />
          </div>
        </div>
      </section>

      {/* CTA 1 */}
      <section className="bg-blue-600 py-10">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-white">
            <h2 className="text-2xl font-bold">Ready to Start Your HVAC Career?</h2>
            <p className="text-blue-100">Apply online in 5 minutes. We handle the rest.</p>
          </div>
          <Link href="/inquiry?program=hvac" className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-bold rounded-full hover:bg-blue-50 whitespace-nowrap">
            Apply Now <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* WRG EXPLAINED */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-80 rounded-2xl overflow-hidden">
              <Image src="/images/programs/classroom-training.jpg" alt="WRG Funded Training" fill className="object-cover" />
            </div>
            <div>
              <span className="text-green-400 font-semibold text-sm">HOW IT'S PAID FOR</span>
              <h2 className="text-3xl font-bold mt-2 mb-6">The Workforce Ready Grant (WRG)</h2>
              <p className="text-slate-300 mb-6">
                The Workforce Ready Grant is an Indiana state program that pays for career training in high-demand fields. HVAC is one of those fields. If you qualify, WRG covers your entire training cost - tuition, books, certification exams, everything.
              </p>
              <p className="text-slate-300 mb-6">
                This is not a loan. You don't pay it back. It's a grant funded by the state of Indiana to help Hoosiers get into good-paying careers. We are an approved WRG training provider, and we help you apply for the funding as part of our enrollment process.
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" /><span>100% tuition covered - you pay $0</span></li>
                <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" /><span>Books and training materials included</span></li>
                <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" /><span>Certification exam fees paid</span></li>
                <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" /><span>Not a loan - no repayment required</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* JRI EXPLAINED */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-blue-600 font-semibold text-sm">WHY EMPLOYERS HIRE OUR GRADUATES</span>
              <h2 className="text-3xl font-bold mt-2 mb-6 text-slate-900">Job Ready Initiative (JRI)</h2>
              <p className="text-slate-600 mb-6">
                JRI is a partnership between training providers and employers. Local HVAC companies work with us to design our curriculum. They tell us exactly what skills they need, and we teach those skills. In return, they commit to interviewing and hiring our graduates.
              </p>
              <p className="text-slate-600 mb-6">
                This means you're not just learning generic HVAC skills - you're learning exactly what Central Indiana employers are looking for. When you graduate, you have employers ready to hire you because they helped design your training.
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" /><span className="text-slate-700">Curriculum designed by local employers</span></li>
                <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" /><span className="text-slate-700">Employers committed to hiring graduates</span></li>
                <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" /><span className="text-slate-700">Training matches real job requirements</span></li>
                <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" /><span className="text-slate-700">Direct pathway from training to employment</span></li>
              </ul>
            </div>
            <div className="relative h-80 rounded-2xl overflow-hidden">
              <Image src="/images/programs/employer-partnership.jpg" alt="Employer Partnership" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* TRAINING OVERVIEW */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">What You'll Learn</h2>
            <p className="text-slate-600 mt-2">Comprehensive training covering all aspects of HVAC work</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <BookOpen className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Online Foundation</h3>
              <p className="text-slate-600 mb-4">Start with theory and fundamentals from home. Learn at your own pace with 24/7 access to our online platform.</p>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li>• HVAC principles and theory</li>
                <li>• Electrical fundamentals</li>
                <li>• Refrigeration cycles</li>
                <li>• Safety and EPA regulations</li>
                <li>• System components</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <Users className="w-12 h-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Hands-On Labs</h3>
              <p className="text-slate-600 mb-4">Practice on real equipment in our training facility. Work with actual HVAC systems under instructor guidance.</p>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li>• Equipment installation</li>
                <li>• System diagnostics</li>
                <li>• Troubleshooting techniques</li>
                <li>• Repair procedures</li>
                <li>• EPA 608 exam prep</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <Briefcase className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Paid OJT</h3>
              <p className="text-slate-600 mb-4">Earn wages while training with an employer partner. Real work experience that often leads to full-time employment.</p>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li>• Paid hourly wages</li>
                <li>• Real job site experience</li>
                <li>• Employer mentorship</li>
                <li>• Professional references</li>
                <li>• Job offer potential</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* OJT DETAILS */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-80 rounded-2xl overflow-hidden">
              <Image src="/images/programs/ojt-work.jpg" alt="On the Job Training" fill className="object-cover" />
            </div>
            <div>
              <span className="text-green-600 font-semibold text-sm">EARN WHILE YOU LEARN</span>
              <h2 className="text-3xl font-bold mt-2 mb-6 text-slate-900">On-the-Job Training (OJT)</h2>
              <p className="text-slate-600 mb-6">
                OJT is the final phase of your training. We place you with a local HVAC employer where you work and earn wages while completing your training. Indiana Career Connect subsidizes part of your wages, which makes employers eager to participate.
              </p>
              <p className="text-slate-600 mb-6">
                This isn't an unpaid internship. You earn real money while gaining real experience. Many of our OJT participants receive full-time job offers from their training employer before they even graduate.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h4 className="font-bold text-green-800 mb-2">OJT Benefits</h4>
                <ul className="space-y-2 text-green-700">
                  <li className="flex gap-2"><CheckCircle className="w-5 h-5 flex-shrink-0" />Paid wages from day one</li>
                  <li className="flex gap-2"><CheckCircle className="w-5 h-5 flex-shrink-0" />Real-world job experience</li>
                  <li className="flex gap-2"><CheckCircle className="w-5 h-5 flex-shrink-0" />Professional references</li>
                  <li className="flex gap-2"><CheckCircle className="w-5 h-5 flex-shrink-0" />Path to full-time employment</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INDIANA CAREER CONNECT */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-purple-600 font-semibold text-sm">REQUIRED STEP</span>
              <h2 className="text-3xl font-bold mt-2 mb-6 text-slate-900">Indiana Career Connect Appointment</h2>
              <p className="text-slate-600 mb-6">
                To access WRG funding and OJT wage subsidies, you must register with Indiana Career Connect and complete an appointment with a career coach. This is a state requirement - we cannot enroll you without it.
              </p>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-6">
                <h4 className="font-bold text-purple-800 mb-3">How to Complete This Step</h4>
                <ol className="space-y-3 text-purple-700">
                  <li className="flex gap-3">
                    <span className="bg-purple-200 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">1</span>
                    <span>Visit <a href="https://indianacareerconnect.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-purple-900">indianacareerconnect.com</a> and create an account</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-purple-200 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">2</span>
                    <span>Complete your profile with work history and education</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-purple-200 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">3</span>
                    <span>Schedule an appointment with your local WorkOne office</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-purple-200 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">4</span>
                    <span>Attend your appointment (in-person or virtual) to discuss your training goals</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-purple-200 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">5</span>
                    <span>Provide us your ICC registration number so we can verify your enrollment</span>
                  </li>
                </ol>
              </div>
              <p className="text-slate-500 text-sm">
                Need help? We can guide you through this process. Just mention it when you apply and we'll walk you through each step.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <Building2 className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-4">What to Bring to Your Appointment</h3>
              <ul className="space-y-3 text-slate-600">
                <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /><span>Government-issued photo ID</span></li>
                <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /><span>Social Security card or number</span></li>
                <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /><span>Proof of Indiana residency (utility bill, lease, etc.)</span></li>
                <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /><span>High school diploma or GED</span></li>
                <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /><span>Proof of income (if applicable for WRG eligibility)</span></li>
              </ul>
              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-sm text-slate-500 mb-3">Find your local WorkOne office:</p>
                <a href="https://www.in.gov/dwd/workone-locations/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-purple-600 font-semibold hover:text-purple-700">
                  WorkOne Office Locator <ArrowRight className="ml-2 w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CERTIFICATIONS */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Certifications You'll Earn</h2>
            <p className="text-blue-200 mt-2">Industry-recognized credentials included in your training</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="font-bold text-lg mb-2">EPA 608 Certification</h3>
              <p className="text-blue-200 text-sm">Required by federal law to work with refrigerants. We cover the exam fee.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="font-bold text-lg mb-2">OSHA 10 Safety</h3>
              <p className="text-blue-200 text-sm">Industry-standard workplace safety certification recognized by all employers.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="font-bold text-lg mb-2">Program Certificate</h3>
              <p className="text-blue-200 text-sm">Completion certificate documenting your training hours and competencies.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ELIGIBILITY */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Who Qualifies for Free Training?</h2>
            <p className="text-slate-600 mt-2">WRG funding is available to Indiana residents who meet certain criteria</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-slate-900 mb-4">Basic Requirements</h3>
                <ul className="space-y-3">
                  <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /><span>Indiana resident</span></li>
                  <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /><span>18 years or older</span></li>
                  <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /><span>High school diploma or GED</span></li>
                  <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /><span>Meet income guidelines OR receive assistance</span></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-4">Also May Qualify</h3>
                <ul className="space-y-3">
                  <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" /><span>Veterans and military spouses</span></li>
                  <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" /><span>Single parents</span></li>
                  <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" /><span>Individuals with disabilities</span></li>
                  <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" /><span>Unemployed or underemployed</span></li>
                </ul>
              </div>
            </div>
            <p className="text-center text-slate-500 mt-6 text-sm">Not sure if you qualify? Apply anyway - we'll review your situation and find every possible funding pathway.</p>
          </div>
        </div>
      </section>

      {/* CAREER STATS */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-12">HVAC Career Outlook</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div><div className="text-4xl font-bold text-blue-600">$45K+</div><div className="text-slate-600">Average Starting Salary</div></div>
            <div><div className="text-4xl font-bold text-green-600">90%</div><div className="text-slate-600">Job Placement Rate</div></div>
            <div><div className="text-4xl font-bold text-purple-600">15%</div><div className="text-slate-600">Industry Growth</div></div>
            <div><div className="text-4xl font-bold text-orange-600">500+</div><div className="text-slate-600">Local Job Openings</div></div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Shield className="w-16 h-16 text-green-400 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">No Debt. No Risk. Real Career.</h2>
          <p className="text-xl text-slate-300 mb-8">Apply in 5 minutes. We verify your eligibility and handle your Indiana Career Connect enrollment.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/inquiry?program=hvac" className="inline-flex items-center justify-center px-8 py-4 bg-green-500 text-white font-bold rounded-full hover:bg-green-400">
              Start Free Application <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link href="/programs/hvac/apply" className="inline-flex items-center justify-center px-8 py-4 bg-slate-700 text-white font-bold rounded-full hover:bg-slate-600 border border-slate-600">
              View Application Details
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

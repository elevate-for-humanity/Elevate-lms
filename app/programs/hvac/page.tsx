import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import PageAvatar from '@/components/PageAvatar';
import { DollarSign, Award, ArrowRight } from 'lucide-react';

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
            <p className="text-lg text-slate-800 mb-6">
              Heating, Ventilation, and Air Conditioning (HVAC) technicians install, maintain, and repair climate control systems in homes and businesses. This is a high-demand trade with excellent pay and job security.
            </p>
            <p className="text-lg text-slate-800 mb-6">
              Our program takes you from zero experience to job-ready in 12-16 weeks. You'll learn online first, then get hands-on training in our lab, and finish with paid on-the-job training with a local employer.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">$0</div>
                <div className="text-sm text-slate-800">Your Cost</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <Award className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">EPA 608</div>
                <div className="text-sm text-slate-800">Certified</div>
              </div>
            </div>
          </div>
          <div className="relative h-96 rounded-2xl overflow-hidden">
            <Image src="/images/hvac-technician.jpg" alt="HVAC Technician at Work" fill className="object-cover" />
          </div>
        </div>
      </section>

      {/* GALLERY STRIP */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
            <Image src="/images/hvac-hero.jpg" alt="HVAC Training" fill className="object-cover" />
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
            <Image src="/images/hvac-technician-success.jpg" alt="HVAC Technician Success" fill className="object-cover" />
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
            <Image src="/images/programs/hvac-hero.jpg" alt="HVAC Equipment" fill className="object-cover" />
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
              <Image src="/images/employers/partnership-meeting.jpg" alt="WRG Funded Training" fill className="object-cover" />
            </div>
            <div>
              <span className="text-green-400 font-semibold text-sm">HOW IT'S PAID FOR</span>
              <h2 className="text-3xl font-bold mt-2 mb-6">The Workforce Ready Grant (WRG)</h2>
              <p className="text-slate-200 mb-6">
                The Workforce Ready Grant is an Indiana state program that pays for career training in high-demand fields. HVAC is one of those fields. If you qualify, WRG covers your entire training cost - tuition, books, certification exams, everything.
              </p>
              <p className="text-slate-200 mb-6">
                This is not a loan. You don't pay it back. It's a grant funded by the state of Indiana to help Hoosiers get into good-paying careers. We are an approved WRG training provider, and we help you apply for the funding as part of our enrollment process.
              </p>
              <ul className="space-y-2 text-white">
                <li>• 100% tuition covered - you pay $0</li>
                <li>• Books and training materials included</li>
                <li>• Certification exam fees paid</li>
                <li>• Not a loan - no repayment required</li>
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
              <p className="text-slate-800 mb-6">
                JRI is a partnership between training providers and employers. Local HVAC companies work with us to design our curriculum. They tell us exactly what skills they need, and we teach those skills. In return, they commit to interviewing and hiring our graduates.
              </p>
              <p className="text-slate-800 mb-6">
                This means you're not just learning generic HVAC skills - you're learning exactly what Central Indiana employers are looking for. When you graduate, you have employers ready to hire you because they helped design your training.
              </p>
              <ul className="space-y-2 text-slate-800">
                <li>• Curriculum designed by local employers</li>
                <li>• Employers committed to hiring graduates</li>
                <li>• Training matches real job requirements</li>
                <li>• Direct pathway from training to employment</li>
              </ul>
            </div>
            <div className="relative h-80 rounded-2xl overflow-hidden">
              <Image src="/images/employers/partnership-handshake.jpg" alt="Employer Partnership" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* TRAINING OVERVIEW */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">What You'll Learn</h2>
            <p className="text-slate-800 mt-2">Comprehensive training covering all aspects of HVAC work</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="relative h-48">
                <Image src="/images/homepage/student-portal-interface.png" alt="Online Learning" fill className="object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-3">Online Foundation</h3>
                <p className="text-slate-800 mb-4">Start with theory and fundamentals from home. Learn at your own pace with 24/7 access to our online platform.</p>
                <ul className="space-y-2 text-slate-800 text-sm">
                  <li>• HVAC principles and theory</li>
                  <li>• Electrical fundamentals</li>
                  <li>• Refrigeration cycles</li>
                  <li>• Safety and EPA regulations</li>
                  <li>• System components</li>
                </ul>
              </div>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="relative h-48">
                <Image src="/images/hvac-hero.jpg" alt="Hands-On Labs" fill className="object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-3">Hands-On Labs</h3>
                <p className="text-slate-800 mb-4">Practice on real equipment in our training facility. Work with actual HVAC systems under instructor guidance.</p>
                <ul className="space-y-2 text-slate-800 text-sm">
                  <li>• Equipment installation</li>
                  <li>• System diagnostics</li>
                  <li>• Troubleshooting techniques</li>
                  <li>• Repair procedures</li>
                  <li>• EPA 608 exam prep</li>
                </ul>
              </div>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="relative h-48">
                <Image src="/images/homepage/earn-while-you-learn.png" alt="Paid OJT" fill className="object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-3">Paid OJT</h3>
                <p className="text-slate-800 mb-4">Earn wages while training with an employer partner. Real work experience that often leads to full-time employment.</p>
                <ul className="space-y-2 text-slate-800 text-sm">
                  <li>• Paid hourly wages</li>
                  <li>• Real job site experience</li>
                  <li>• Employer mentorship</li>
                  <li>• Professional references</li>
                  <li>• Job offer potential</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OJT DETAILS */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-80 rounded-2xl overflow-hidden">
              <Image src="/images/hvac-technician-success.jpg" alt="On the Job Training" fill className="object-cover" />
            </div>
            <div>
              <span className="text-green-600 font-semibold text-sm">EARN WHILE YOU LEARN</span>
              <h2 className="text-3xl font-bold mt-2 mb-6 text-slate-900">On-the-Job Training (OJT)</h2>
              <p className="text-slate-800 mb-6">
                OJT is the final phase of your training. We place you with a local HVAC employer where you work and earn wages while completing your training. Indiana Career Connect subsidizes part of your wages, which makes employers eager to participate.
              </p>
              <p className="text-slate-800 mb-6">
                This isn't an unpaid internship. You earn real money while gaining real experience. Many of our OJT participants receive full-time job offers from their training employer before they even graduate.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h4 className="font-bold text-green-800 mb-2">OJT Benefits</h4>
                <ul className="space-y-2 text-green-700">
                  <li>• Paid wages from day one</li>
                  <li>• Real-world job experience</li>
                  <li>• Professional references</li>
                  <li>• Path to full-time employment</li>
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
              <p className="text-slate-800 mb-6">
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
              <p className="text-slate-700 text-sm">
                Need help? We can guide you through this process. Just mention it when you apply and we'll walk you through each step.
              </p>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200">
              <div className="relative h-48">
                <Image src="/images/career-services/workshop.jpg" alt="Career Services Workshop" fill className="object-cover" />
              </div>
              <div className="p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4">What to Bring to Your Appointment</h3>
              <ul className="space-y-2 text-slate-800">
                <li>• Government-issued photo ID</li>
                <li>• Social Security card or number</li>
                <li>• Proof of Indiana residency (utility bill, lease, etc.)</li>
                <li>• High school diploma or GED</li>
                <li>• Proof of income (if applicable for WRG eligibility)</li>
              </ul>
              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-sm text-slate-700 mb-3">Find your local WorkOne office:</p>
                <a href="https://www.in.gov/dwd/workone-locations/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-purple-600 font-semibold hover:text-purple-700">
                  WorkOne Office Locator <ArrowRight className="ml-2 w-4 h-4" />
                </a>
              </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ETPL PROGRAM INFO */}
      <section className="py-8 bg-blue-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold">ETPL APPROVED</div>
              <span className="text-slate-600 text-sm">Program Location ID: <strong>10004322</strong></span>
            </div>
            <p className="text-slate-700">
              This program is listed on Indiana's <a href="https://www.in.gov/dwd/career-training/etpl/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold">Eligible Training Provider List (ETPL)</a> and approved for Workforce Ready Grant funding. 
              <a href="https://www.nextleveljobs.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-1">Learn more at NextLevelJobs.org</a>
            </p>
          </div>
        </div>
      </section>

      {/* CERTIFICATIONS - ETPL CREDENTIALS */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Industry-Recognized Credentials</h2>
            <p className="text-slate-300 mt-2">All certifications included in your training - required for employment in this field</p>
          </div>
          
          {/* Main Certifications Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-8">
            {/* Residential HVAC Certification 1 */}
            <div className="bg-slate-800 rounded-2xl p-6">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">Residential HVAC Certification 1</h3>
              <p className="text-slate-300 text-sm mb-3">Core residential heating and cooling systems installation and service.</p>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• Required for employment</li>
                <li>• Test required</li>
                <li>• Obtained in this program</li>
              </ul>
            </div>

            {/* Residential HVAC Certification 2 */}
            <div className="bg-slate-800 rounded-2xl p-6">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">Residential HVAC Certification 2</h3>
              <p className="text-slate-300 text-sm mb-3">Refrigeration diagnostics and advanced troubleshooting.</p>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• Required for employment</li>
                <li>• Test required</li>
                <li>• Obtained in this program</li>
              </ul>
            </div>

            {/* OSHA 30 */}
            <div className="bg-slate-800 rounded-2xl p-6">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">OSHA 30 Safety</h3>
              <p className="text-slate-300 text-sm mb-3">Comprehensive workplace safety certification for construction and general industry.</p>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• Required for employment</li>
                <li>• Test required</li>
                <li>• Obtained in this program</li>
              </ul>
            </div>

            {/* CPR Certification */}
            <div className="bg-slate-800 rounded-2xl p-6">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">CPR Certification</h3>
              <p className="text-slate-300 text-sm mb-3">Emergency response and life-saving skills for workplace safety.</p>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• Required for employment</li>
                <li>• Test required</li>
                <li>• Obtained in this program</li>
              </ul>
            </div>

            {/* Rise Up Certificate */}
            <div className="bg-slate-800 rounded-2xl p-6">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">Rise Up Certificate</h3>
              <p className="text-slate-300 text-sm mb-3">Professional skills and workplace readiness certification.</p>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• Required for employment</li>
                <li>• Test required</li>
                <li>• Obtained in this program</li>
              </ul>
            </div>
          </div>

          {/* Program Accreditation Note */}
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <p className="text-green-400 font-semibold mb-2">Program Accredited: Yes</p>
              <p className="text-slate-400 text-sm">Curriculum includes specific learning objectives, learning checkpoints, and timeline/calendar.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ELIGIBILITY */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Who Qualifies for Free Training?</h2>
            <p className="text-slate-800 mt-2">WRG funding is available to Indiana residents who meet certain criteria</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-slate-900 mb-4">Basic Requirements</h3>
                <ul className="space-y-2 text-slate-800">
                  <li>• Indiana resident</li>
                  <li>• 18 years or older</li>
                  <li>• High school diploma or GED</li>
                  <li>• Meet income guidelines OR receive assistance</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-4">Also May Qualify</h3>
                <ul className="space-y-2 text-slate-800">
                  <li>• Veterans and military spouses</li>
                  <li>• Single parents</li>
                  <li>• Individuals with disabilities</li>
                  <li>• Unemployed or underemployed</li>
                </ul>
              </div>
            </div>
            <p className="text-center text-slate-700 mt-6 text-sm">Not sure if you qualify? Apply anyway - we'll review your situation and find every possible funding pathway.</p>
          </div>
        </div>
      </section>

      {/* CAREER STATS */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-12">HVAC Career Outlook</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div><div className="text-4xl font-bold text-blue-600">$45K+</div><div className="text-slate-800">Average Starting Salary</div></div>
            <div><div className="text-4xl font-bold text-green-600">90%</div><div className="text-slate-800">Job Placement Rate</div></div>
            <div><div className="text-4xl font-bold text-purple-600">15%</div><div className="text-slate-800">Industry Growth</div></div>
            <div><div className="text-4xl font-bold text-orange-600">500+</div><div className="text-slate-800">Local Job Openings</div></div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-2">Is this program really free?</h3>
              <p className="text-slate-700">Yes, for eligible participants. The Workforce Ready Grant (WRG) covers 100% of tuition, books, certification exams, and training materials. You pay $0 out of pocket if you qualify.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-2">What are the eligibility requirements?</h3>
              <p className="text-slate-700">You must be an Indiana resident, 18 or older, with a high school diploma or GED. You must also meet income guidelines or receive public assistance. Veterans, single parents, and individuals with disabilities may also qualify.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-2">How long is the program?</h3>
              <p className="text-slate-700">The program takes 12-16 weeks to complete, including online coursework, hands-on lab training, and paid on-the-job training (OJT) with an employer partner.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-2">What certifications will I earn?</h3>
              <p className="text-slate-700">You will earn 5 industry-recognized credentials: Residential HVAC Certification 1, Residential HVAC Certification 2 (Refrigeration Diagnostics), OSHA 30 Safety, CPR Certification, and Rise Up Certificate.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-2">What is Indiana Career Connect?</h3>
              <p className="text-slate-700">Indiana Career Connect is the state's workforce system. You must register and complete an appointment with a career coach to access WRG funding. We help you through this process.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-2">Will I get paid during training?</h3>
              <p className="text-slate-700">Yes! During the OJT (On-the-Job Training) phase, you work with an employer partner and earn wages while completing your training hours.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-2">What happens after I complete the program?</h3>
              <p className="text-slate-700">Many OJT participants receive full-time job offers from their training employer. We also provide job placement assistance to help you find employment with our employer partners.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">No Debt. No Risk. Real Career.</h2>
          <p className="text-xl text-slate-200 mb-8">Apply in 5 minutes. We verify your eligibility and handle your Indiana Career Connect enrollment.</p>
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

'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Check, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

export default function SchoolLicensePage() {
  const [activeSection, setActiveSection] = useState<string | null>('maria');

  return (
    <div className="bg-white min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "School License" }]} />
      </div>
{/* Hero - Clean */}
      <section className="relative h-[50vh] overflow-hidden">
        <Image
          src="/images/technology/hero-programs-technology.jpg"
          alt="School License Platform"
          fill
          className="object-cover"
          priority
        />
      </section>

      {/* Price Bar */}
      <section className="bg-slate-900 text-white py-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-3xl font-black">$15,000</span>
            <span className="text-slate-400 ml-2">one-time</span>
          </div>
          <div className="flex gap-4">
            <Link href="/contact?subject=School%20License" className="bg-white text-slate-900 px-6 py-3 rounded-lg font-bold hover:bg-slate-100">
              Schedule Demo
            </Link>
            <Link href="/store/checkout?license=school" className="bg-orange-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-700">
              Purchase Now
            </Link>
          </div>
        </div>
      </section>

      {/* The Story: Meet Maria */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-black mb-8 text-center">Meet Maria</h2>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-gray-600 leading-relaxed">
              Maria runs a workforce training center in Indianapolis. She has 8 programs, 
              400 students a year, and a team of 5. Her days used to look like this:
            </p>
          </div>

          {/* Before - The Pain */}
          <div className="mt-12 bg-red-50 rounded-2xl p-8 border-2 border-red-100">
            <h3 className="text-2xl font-black text-red-800 mb-6">Before: The Daily Chaos</h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <h4 className="font-bold text-lg">7:30 AM - Paper Applications</h4>
                  <p className="text-gray-600">
                    Maria arrives to find 12 paper applications in her inbox. She spends 2 hours 
                    entering data into three different spreadsheets—one for enrollment, one for 
                    WIOA tracking, one for her funder reports.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📞</span>
                </div>
                <div>
                  <h4 className="font-bold text-lg">10:00 AM - Phone Tag</h4>
                  <p className="text-gray-600">
                    A WorkOne advisor calls asking about a student's eligibility status. Maria 
                    digs through folders, finds the file, realizes the income verification is 
                    missing. She calls the student. Voicemail. She'll try again tomorrow.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">😰</span>
                </div>
                <div>
                  <h4 className="font-bold text-lg">2:00 PM - The Compliance Scramble</h4>
                  <p className="text-gray-600">
                    Quarterly report is due Friday. Maria's compliance officer is out sick. 
                    She spends 4 hours pulling data from the LMS, cross-referencing with 
                    attendance sheets, and manually calculating completion rates. She finds 
                    3 students who completed but were never marked as "exited" in the system.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🌙</span>
                </div>
                <div>
                  <h4 className="font-bold text-lg">6:30 PM - Still There</h4>
                  <p className="text-gray-600">
                    Maria finally leaves. She didn't get to the curriculum updates she planned. 
                    Or the employer outreach. Or the grant application due next month. She spent 
                    the entire day on data entry and putting out fires.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-red-100 rounded-lg">
              <p className="text-red-800 font-medium text-center">
                Sound familiar? Maria was drowning. Her team was burning out. 
                Something had to change.
              </p>
            </div>
          </div>

          {/* The Turning Point */}
          <div className="mt-12 text-center">
            <div className="inline-block bg-orange-100 text-orange-800 px-6 py-3 rounded-full font-bold">
              Then Maria found Elevate
            </div>
          </div>

          {/* After - The Transformation */}
          <div className="mt-12 bg-green-50 rounded-2xl p-8 border-2 border-green-100">
            <h3 className="text-2xl font-black text-green-800 mb-6">After: The New Reality</h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">☀️</span>
                </div>
                <div>
                  <h4 className="font-bold text-lg">7:30 AM - Coffee First</h4>
                  <p className="text-gray-600">
                    Maria checks her dashboard. 8 new applications came in overnight—already 
                    processed. 6 were auto-approved (eligibility verified). 2 are waiting on 
                    documents (students got automatic reminders). She sips her coffee.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">•</span>
                </div>
                <div>
                  <h4 className="font-bold text-lg">10:00 AM - Instant Answers</h4>
                  <p className="text-gray-600">
                    WorkOne advisor calls about a student. Maria types the name, sees the 
                    complete record: application date, eligibility status, enrolled program, 
                    current progress, attendance rate. "She's at 78% completion, on track to 
                    finish next month." Call takes 2 minutes.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h4 className="font-bold text-lg">2:00 PM - One-Click Reports</h4>
                  <p className="text-gray-600">
                    Quarterly report? Maria clicks "Generate WIOA Report." The system pulls 
                    enrollment, completion, credential attainment, and employment outcomes. 
                    Formatted exactly how the state wants it. Done in 30 seconds.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🚀</span>
                </div>
                <div>
                  <h4 className="font-bold text-lg">4:00 PM - Actually Growing</h4>
                  <p className="text-gray-600">
                    Maria spends the afternoon on what matters: meeting with a new employer 
                    partner, reviewing curriculum with her lead instructor, and drafting that 
                    grant application. She leaves at 5:00.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-green-100 rounded-lg">
              <p className="text-green-800 font-medium text-center">
                Maria didn't hire more staff. She didn't work more hours. 
                She just stopped doing work the system should do.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Numbers */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black mb-12 text-center">Maria's Results After 6 Months</h2>
          
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-black text-orange-400">73%</div>
              <div className="text-slate-400 mt-2">Less time on admin</div>
            </div>
            <div>
              <div className="text-5xl font-black text-orange-400">2→5</div>
              <div className="text-slate-400 mt-2">Days to enroll → Hours</div>
            </div>
            <div>
              <div className="text-5xl font-black text-orange-400">100%</div>
              <div className="text-slate-400 mt-2">Compliance accuracy</div>
            </div>
            <div>
              <div className="text-5xl font-black text-orange-400">+40%</div>
              <div className="text-slate-400 mt-2">More students served</div>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black mb-4 text-center">What Maria Got (What You'll Get)</h2>
          <p className="text-xl text-gray-600 mb-12 text-center max-w-2xl mx-auto">
            Everything needed to run a training organization without the chaos.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Self-Service Enrollment',
                desc: 'Students apply online, upload documents, and get instant eligibility decisions. No staff time required.',
                img: '/images/healthcare/hero-healthcare-professionals.jpg'
              },
              {
                title: 'Complete LMS',
                desc: 'Courses, quizzes, certificates, progress tracking. Students learn on any device. Instructors see everything.',
                img: '/images/technology/hero-programs-technology.jpg'
              },
              {
                title: 'Automated Compliance',
                desc: 'WIOA fields enforced at enrollment. Reports generate automatically. Audit trail for everything.',
                img: '/images/heroes-hq/funding-hero.jpg'
              },
              {
                title: 'Case Management',
                desc: 'Track barriers, interventions, and outcomes. Flag at-risk students. Coordinate services.',
                img: '/images/healthcare/program-cna-overview.jpg'
              },
              {
                title: 'Employer Portal',
                desc: 'Employers post jobs, view candidates, verify credentials. Placement tracking built in.',
                img: '/images/trades/program-building-construction.jpg'
              },
              {
                title: 'Your Brand',
                desc: 'Your logo, your colors, your domain. Students see your organization, not ours.',
                img: '/images/business/tax-prep-certification.jpg'
              },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl overflow-hidden">
                <div className="relative h-40">
                  <Image src={item.img} alt={item.title} fill className="object-cover" />
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Process */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black mb-12 text-center">From Purchase to Live in 2 Weeks</h2>
          
          <div className="space-y-8">
            {[
              { day: 'Day 1', title: 'Purchase & Kickoff Call', desc: 'We set up your account, configure your branding, and walk through the admin dashboard together.' },
              { day: 'Days 2-5', title: 'Add Your Programs', desc: 'Upload your courses, set up enrollment forms, configure eligibility rules. We provide templates.' },
              { day: 'Days 6-10', title: 'Staff Training', desc: 'Your team learns the system. Video tutorials + live Q&A. Most staff are comfortable in 2-3 hours.' },
              { day: 'Days 11-14', title: 'Soft Launch', desc: 'Enroll a small cohort. Work out any kinks. Get feedback. Make adjustments.' },
              { day: 'Day 15+', title: 'Full Launch', desc: 'Open enrollment to everyone. We monitor for the first month. You focus on growing.' },
            ].map((step, i) => (
              <div key={i} className="flex gap-6">
                <div className="w-24 flex-shrink-0">
                  <span className="inline-block bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {step.day}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black mb-12 text-center">Questions Maria Asked</h2>
          
          <div className="space-y-6">
            {[
              { q: '"What if my team isn\'t technical?"', a: 'Neither is Maria\'s. The platform is designed for program staff, not IT. If you can use email, you can use this.' },
              { q: '"What about our existing students?"', a: 'We migrate your data. Student records, completions, everything. No one starts over.' },
              { q: '"What if we need something custom?"', a: 'We do custom development at $150/hour. Most requests take 5-20 hours. Or suggest it—we might build it for everyone.' },
              { q: '"What happens if something breaks?"', a: '2 years of priority support included. Email, chat, screen sharing. We respond within 24 hours, usually faster.' },
              { q: '"Is $15,000 really worth it?"', a: 'Maria calculated she was spending $4,000/month on her old systems plus 60+ hours of staff time. The platform paid for itself in 4 months.' },
            ].map((faq, i) => (
              <div key={i} className="border-b border-gray-200 pb-6">
                <h3 className="font-bold text-lg mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black mb-4">Ready to Be Like Maria?</h2>
          <p className="text-xl text-orange-100 mb-8">
            Stop drowning in admin. Start growing your programs.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link 
              href="/store/licenses/checkout/school-license"
              className="bg-white text-orange-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-orange-50"
            >
              Get Started — $15,000
            </Link>
            <Link 
              href="/store/demo"
              className="bg-orange-700 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-orange-800 border-2 border-orange-500"
            >
              See Platform Tour
            </Link>
          </div>
          <p className="mt-8 text-orange-200">
            Questions? <Link href="/contact?topic=licensing" className="underline hover:text-white">Contact us</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
